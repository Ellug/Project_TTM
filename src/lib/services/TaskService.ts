"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
    const tasksQuery = query(tasksRef, orderBy("createdAt", "desc"));
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
        status: "Backlog",
        priority: data.priority,
        completed: false,
        assigneeIds: [],
        labels: [],
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
}
