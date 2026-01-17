"use client";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MemberRole, Project } from "@/lib/types";
import { MilestoneService } from "./MilestoneService";
import { UserService } from "./UserService";

export class ProjectService {
  static subscribeProjectsForUser(
    userId: string,
    onUpdate: (projects: Project[]) => void
  ) {
    const projectsRef = collection(db, "projects");
    const projectsQuery = query(
      projectsRef,
      where("memberIds", "array-contains", userId)
    );
    return onSnapshot(projectsQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Project, "id">),
      }));
      const sorted = items.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime;
      });
      onUpdate(sorted);
    });
  }

  static subscribeProject(
    projectId: string,
    onUpdate: (project: Project | null) => void
  ) {
    const projectRef = doc(db, "projects", projectId);
    return onSnapshot(projectRef, (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Project, "id">),
      });
    });
  }

  static async createProject({
    name,
    description,
    ownerId,
  }: {
    name: string;
    description: string;
    ownerId: string;
  }) {
    await addDoc(collection(db, "projects"), {
      name,
      description,
      ownerId,
      memberIds: [ownerId],
      memberRoles: {
        [ownerId]: "owner",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  static async updateProject(
    projectId: string,
    updates: Partial<Pick<Project, "name" | "description" | "memberIds">> & {
      memberRoles?: Record<string, MemberRole>;
    }
  ) {
    await updateDoc(doc(db, "projects", projectId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  static async touchProject(projectId: string) {
    await updateDoc(doc(db, "projects", projectId), {
      updatedAt: serverTimestamp(),
    });
  }

  static async deleteProjectCascade(projectId: string) {
    const milestonesRef = collection(db, "projects", projectId, "milestones");
    const milestoneSnapshot = await getDocs(milestonesRef);
    await Promise.all(
      milestoneSnapshot.docs.map((milestoneDoc) =>
        MilestoneService.deleteMilestoneCascade(projectId, milestoneDoc.id)
      )
    );
    await deleteDoc(doc(db, "projects", projectId));
  }

  static async inviteMemberByEmail(projectId: string, email: string) {
    const invitee = await UserService.findByEmail(email);
    if (!invitee) return null;
    await updateDoc(doc(db, "projects", projectId), {
      memberIds: arrayUnion(invitee.uid),
      [`memberRoles.${invitee.uid}`]: "editor",
      updatedAt: serverTimestamp(),
    });
    return invitee;
  }

  static async updateMemberRole(
    projectId: string,
    memberId: string,
    role: MemberRole
  ) {
    await updateDoc(doc(db, "projects", projectId), {
      [`memberRoles.${memberId}`]: role,
      updatedAt: serverTimestamp(),
    });
  }

  static async removeMember(projectId: string, memberId: string) {
    await updateDoc(doc(db, "projects", projectId), {
      memberIds: arrayRemove(memberId),
      [`memberRoles.${memberId}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
  }
}
