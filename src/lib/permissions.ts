"use client";

import type { MemberRole, Project } from "@/lib/types";

export const resolveMemberRole = (
  project: Project | null,
  userId?: string | null
): MemberRole => {
  if (!project || !userId) return "viewer";
  if (project.ownerId === userId) return "owner";
  return project.memberRoles?.[userId] ?? "editor";
};

export const canEditProjectContent = (role: MemberRole) => role !== "viewer";
