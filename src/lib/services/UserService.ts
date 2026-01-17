"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

export class UserService {
  static async fetchProfiles(userIds: string[]): Promise<UserProfile[]> {
    if (!userIds.length) return [];
    const snapshots = await Promise.all(
      userIds.map((uid) => getDoc(doc(db, "users", uid)))
    );
    return snapshots
      .filter((snapshot) => snapshot.exists())
      .map((snapshot) => snapshot.data() as UserProfile);
  }

  static async findByEmail(email: string): Promise<UserProfile | null> {
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(userQuery);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserProfile;
  }
}
