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
import type { ProjectPost } from "@/lib/types";

export class ProjectPostService {
  static subscribePosts(
    projectId: string,
    onUpdate: (posts: ProjectPost[]) => void
  ) {
    const postsRef = collection(db, "projects", projectId, "posts");
    const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
    return onSnapshot(postsQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<ProjectPost, "id">),
      }));
      onUpdate(items);
    });
  }

  static async createPost(
    projectId: string,
    data: Pick<
      ProjectPost,
      "title" | "content" | "category" | "authorId" | "authorName" | "authorPhotoURL"
    >
  ) {
    return addDoc(collection(db, "projects", projectId, "posts"), {
      title: data.title,
      content: data.content,
      category: data.category,
      authorId: data.authorId,
      authorName: data.authorName ?? "",
      authorPhotoURL: data.authorPhotoURL ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  static async updatePost(
    projectId: string,
    postId: string,
    updates: Partial<Pick<ProjectPost, "title" | "content" | "category">>
  ) {
    await updateDoc(doc(db, "projects", projectId, "posts", postId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  static async deletePost(projectId: string, postId: string) {
    await deleteDoc(doc(db, "projects", projectId, "posts", postId));
  }
}
