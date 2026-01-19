"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task } from "@/lib/types";

export class TaskService {
  static subscribeTasks(
    projectId: string,
    milestoneId: string,
    onUpdate: (tasks: Task[]) => void
  ) {
    const tasksRef = collection(
      db,
      "projects",
      projectId,
      "milestones",
      milestoneId,
      "tasks"
    );
    const tasksQuery = query(tasksRef, orderBy("order", "desc"));
    return onSnapshot(tasksQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Task, "id">),
      }));
      onUpdate(items);
    });
  }

  static async createTask(
    projectId: string,
    milestoneId: string,
    data: Pick<
      Task,
      "title" | "description" | "priority" | "dueDate" | "creatorId"
    > &
      Partial<
        Pick<Task, "status" | "completed" | "assigneeIds" | "labels" | "order">
      >
  ) {
    return addDoc(
      collection(
        db,
        "projects",
        projectId,
        "milestones",
        milestoneId,
        "tasks"
      ),
      {
        title: data.title,
        description: data.description,
        status: data.status ?? "Backlog",
        priority: data.priority,
        completed:
          data.completed ?? (data.status === "Done" ? true : false),
        assigneeIds: data.assigneeIds ?? [],
        labels: data.labels ?? [],
        order: data.order ?? Date.now() + Math.random(),
        dueDate: data.dueDate || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        creatorId: data.creatorId,
      }
    );
  }

  static async updateTask(
    projectId: string,
    milestoneId: string,
    taskId: string,
    updates: Partial<Task>
  ) {
    await updateDoc(
      doc(
        db,
        "projects",
        projectId,
        "milestones",
        milestoneId,
        "tasks",
        taskId
      ),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      }
    );
  }

  static async deleteTask(
    projectId: string,
    milestoneId: string,
    taskId: string
  ) {
    await deleteDoc(
      doc(
        db,
        "projects",
        projectId,
        "milestones",
        milestoneId,
        "tasks",
        taskId
      )
    );
  }

  static async deleteTasksForMilestone(
    projectId: string,
    milestoneId: string
  ) {
    const tasksRef = collection(
      db,
      "projects",
      projectId,
      "milestones",
      milestoneId,
      "tasks"
    );
    const tasksSnapshot = await getDocs(tasksRef);
    await Promise.all(
      tasksSnapshot.docs.map((taskDoc) => deleteDoc(taskDoc.ref))
    );
  }

  static async fetchTask(
    projectId: string,
    milestoneId: string,
    taskId: string
  ) {
    return getDoc(
      doc(
        db,
        "projects",
        projectId,
        "milestones",
        milestoneId,
        "tasks",
        taskId
      )
    );
  }

  static async moveTask(
    projectId: string,
    fromMilestoneId: string,
    toMilestoneId: string,
    taskId: string,
    taskData: Omit<Task, "id">
  ) {
    // Create task in destination milestone
    const newTaskRef = await addDoc(
      collection(
        db,
        "projects",
        projectId,
        "milestones",
        toMilestoneId,
        "tasks"
      ),
      {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        completed: taskData.completed,
        assigneeIds: taskData.assigneeIds,
        labels: taskData.labels,
        order: Date.now() + Math.random(),
        dueDate: taskData.dueDate || "",
        creatorId: taskData.creatorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    // Delete task from source milestone
    await deleteDoc(
      doc(
        db,
        "projects",
        projectId,
        "milestones",
        fromMilestoneId,
        "tasks",
        taskId
      )
    );

    return newTaskRef;
  }
}
