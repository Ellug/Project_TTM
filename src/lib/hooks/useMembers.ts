"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/types";
import { UserService } from "@/lib/services/UserService";

export const useMembers = (memberIds?: string[]) => {
  const [members, setMembers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!memberIds?.length) {
      setMembers([]);
      return;
    }
    let isActive = true;
    UserService.fetchProfiles(memberIds)
      .then((profiles) => {
        if (isActive) setMembers(profiles);
      })
      .catch(() => {
        if (isActive) setMembers([]);
      });
    return () => {
      isActive = false;
    };
  }, [memberIds?.join("|")]);

  return members;
};
