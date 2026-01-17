"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectService } from "@/lib/services/ProjectService";

export const useProjects = (userId?: string | null) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      return;
    }
    const unsubscribe = ProjectService.subscribeProjectsForUser(
      userId,
      setProjects
    );
    return () => unsubscribe();
  }, [userId]);

  return projects;
};
