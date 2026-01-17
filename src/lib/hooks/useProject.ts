"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectService } from "@/lib/services/ProjectService";

export const useProject = (projectId?: string | null) => {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    const unsubscribe = ProjectService.subscribeProject(
      projectId,
      setProject
    );
    return () => unsubscribe();
  }, [projectId]);

  return project;
};
