"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
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

let cachedAllUsers: UserProfile[] = [];
let allUsersUnsubscribe: (() => void) | null = null;
const allUsersSubscribers = new Set<(users: UserProfile[]) => void>();

const notifyAllUsers = () => {
  allUsersSubscribers.forEach((listener) => listener(cachedAllUsers));
};

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

  static subscribeAllUsers(onUpdate: (users: UserProfile[]) => void) {
    allUsersSubscribers.add(onUpdate);
    onUpdate(cachedAllUsers);
    if (!allUsersUnsubscribe) {
      const usersRef = collection(db, "users");
      allUsersUnsubscribe = onSnapshot(usersRef, (snapshot) => {
        cachedAllUsers = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as UserProfile;
          return { ...data, uid: data.uid ?? docSnapshot.id };
        });
        notifyAllUsers();
      });
    }
    return () => {
      allUsersSubscribers.delete(onUpdate);
      if (allUsersSubscribers.size === 0 && allUsersUnsubscribe) {
        allUsersUnsubscribe();
        allUsersUnsubscribe = null;
      }
    };
  }

  static async fetchAllUsers(): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as UserProfile;
      return { ...data, uid: data.uid ?? docSnapshot.id };
    });
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
