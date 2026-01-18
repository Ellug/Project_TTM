"use client";

import { useEffect, useState } from "react";
import type { ProjectPost } from "@/lib/types";
import { ProjectPostService } from "@/lib/services/ProjectPostService";

export const useProjectPosts = (projectId?: string | null) => {
  const [posts, setPosts] = useState<ProjectPost[]>([]);

  useEffect(() => {
    if (!projectId) {
      setPosts([]);
      return;
    }
    const unsubscribe = ProjectPostService.subscribePosts(projectId, setPosts);
    return () => unsubscribe();
  }, [projectId]);

  return posts;
};
