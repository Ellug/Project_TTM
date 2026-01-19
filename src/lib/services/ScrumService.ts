"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Scrum, ScrumEntry } from "@/lib/types";

export class ScrumService {
  static subscribeScrums(
    projectId: string,
    onUpdate: (scrums: Scrum[]) => void
  ) {
    const scrumsRef = collection(db, "projects", projectId, "scrums");
    const scrumsQuery = query(scrumsRef, orderBy("date", "desc"));
    return onSnapshot(scrumsQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Scrum, "id">),
      }));
      onUpdate(items);
    });
  }

  static async createScrum(
    projectId: string,
    data: Pick<Scrum, "date" | "userId" | "userName" | "userPhotoURL" | "items">
  ) {
    return addDoc(collection(db, "projects", projectId, "scrums"), {
      date: data.date,
      userId: data.userId,
      userName: data.userName ?? "",
      userPhotoURL: data.userPhotoURL ?? "",
      items: data.items,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  static async updateScrumItems(
    projectId: string,
    scrumId: string,
    items: ScrumEntry[]
  ) {
    await updateDoc(doc(db, "projects", projectId, "scrums", scrumId), {
      items,
      updatedAt: serverTimestamp(),
    });
  }

  static async deleteScrum(projectId: string, scrumId: string) {
    await deleteDoc(doc(db, "projects", projectId, "scrums", scrumId));
  }
}
