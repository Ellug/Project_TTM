"use client";

import { useEffect, useState } from "react";
import type { Milestone } from "@/lib/types";
import { MilestoneService } from "@/lib/services/MilestoneService";

export const useMilestones = (projectId?: string | null) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (!projectId) {
      setMilestones([]);
      return;
    }
    const unsubscribe = MilestoneService.subscribeMilestones(
      projectId,
      setMilestones
    );
    return () => unsubscribe();
  }, [projectId]);

  return milestones;
};
