"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CsvFormat, CsvFormatColumns } from "@/lib/types";

type CsvFormatInput = {
  name: string;
  hasHeader: boolean;
  columns: CsvFormatColumns;
};

export class CsvFormatService {
  static subscribeFormats(
    userId: string,
    onUpdate: (formats: CsvFormat[]) => void
  ) {
    const formatsRef = collection(db, "users", userId, "csvFormats");
    return onSnapshot(formatsRef, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<CsvFormat, "id">),
      }));
      const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(sorted);
    });
  }

  static async createFormat(userId: string, data: CsvFormatInput) {
    return addDoc(collection(db, "users", userId, "csvFormats"), {
      name: data.name,
      hasHeader: data.hasHeader,
      columns: data.columns,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  static async deleteFormat(userId: string, formatId: string) {
    await deleteDoc(doc(db, "users", userId, "csvFormats", formatId));
  }
}
