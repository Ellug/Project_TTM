"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import {
  updateProfile as updateAuthProfile,
  deleteUser as deleteAuthUser,
  type User as FirebaseUser,
} from "firebase/auth";

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

  static async updateProfile(
    uid: string,
    data: { nickname: string; photoURL?: string }
  ) {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      throw new Error("Unauthorized");
    }

    // Update Firebase Auth profile
    await updateAuthProfile(user, {
      displayName: data.nickname,
      ...(data.photoURL && { photoURL: data.photoURL }),
    });

    // Update Firestore profile
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      nickname: data.nickname,
      displayName: data.nickname,
      ...(data.photoURL && { photoURL: data.photoURL }),
    });
  }

  static async deleteUser(user: FirebaseUser) {
    const userDocRef = doc(db, "users", user.uid);

    // Delete user document from Firestore
    await deleteDoc(userDocRef);

    // Delete user from Firebase Auth
    // This requires recent sign-in and is a sensitive operation.
    await deleteAuthUser(user);
  }
}
