"use client";

import { useEffect, useState } from "react";
import type { Scrum } from "@/lib/types";
import { ScrumService } from "@/lib/services/ScrumService";

export const useScrums = (projectId?: string | null) => {
  const [scrums, setScrums] = useState<Scrum[]>([]);

  useEffect(() => {
    if (!projectId) {
      setScrums([]);
      return;
    }
    const unsubscribe = ScrumService.subscribeScrums(projectId, setScrums);
    return () => unsubscribe();
  }, [projectId]);

  return scrums;
};
