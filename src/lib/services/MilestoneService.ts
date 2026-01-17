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
import type { Milestone } from "@/lib/types";
import { TaskService } from "./TaskService";

export class MilestoneService {
  static subscribeMilestone(
    projectId: string,
    milestoneId: string,
    onUpdate: (milestone: Milestone | null) => void
  ) {
    const milestoneRef = doc(db, "projects", projectId, "milestones", milestoneId);
    return onSnapshot(milestoneRef, (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Milestone, "id">),
      });
    });
  }
  static subscribeMilestones(
    projectId: string,
    onUpdate: (milestones: Milestone[]) => void
  ) {
    const milestonesRef = collection(db, "projects", projectId, "milestones");
    const milestonesQuery = query(milestonesRef, orderBy("createdAt", "desc"));
    return onSnapshot(milestonesQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Milestone, "id">),
      }));
      onUpdate(items);
    });
  }

  static async createMilestone(
    projectId: string,
    data: Pick<Milestone, "title" | "description" | "status" | "dueDate">
  ) {
    await addDoc(collection(db, "projects", projectId, "milestones"), {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  static async updateMilestone(
    projectId: string,
    milestoneId: string,
    updates: Partial<Pick<Milestone, "title" | "description" | "status" | "dueDate">>
  ) {
    await updateDoc(
      doc(db, "projects", projectId, "milestones", milestoneId),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      }
    );
  }

  static async deleteMilestoneCascade(projectId: string, milestoneId: string) {
    await TaskService.deleteTasksForMilestone(projectId, milestoneId);
    await deleteDoc(
      doc(db, "projects", projectId, "milestones", milestoneId)
    );
  }

  static async fetchMilestoneTasks(
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
    return getDocs(tasksRef);
  }
}
