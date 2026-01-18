"use client";

import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/organisms/AuthGate";
import { MilestoneCreateForm } from "@/components/organisms/milestones/MilestoneCreateForm";
import { MilestoneCalendar } from "@/components/organisms/milestones/MilestoneCalendar";
import { MilestoneCard } from "@/components/organisms/milestones/MilestoneCard";
import { ProjectHeader } from "@/components/organisms/projects/ProjectHeader";
import { ProjectMembersPanel } from "@/components/organisms/projects/ProjectMembersPanel";
import { Panel } from "@/components/atoms/Panel";
import { useAuth } from "@/components/providers/AuthProvider";
import { milestoneStatuses } from "@/lib/constants";
import { useMembers } from "@/lib/hooks/useMembers";
import { useMilestones } from "@/lib/hooks/useMilestones";
import { useProject } from "@/lib/hooks/useProject";
import { canEditProjectContent, resolveMemberRole } from "@/lib/permissions";
import { MilestoneService } from "@/lib/services/MilestoneService";
import { ProjectService } from "@/lib/services/ProjectService";

export default function MilestonesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const { user } = useAuth();

  const project = useProject(projectId);
  const milestones = useMilestones(projectId);
  const members = useMembers(project?.memberIds);

  const isOwner = user?.uid === project?.ownerId;
  const currentRole = resolveMemberRole(project, user?.uid);
  const canEditMilestones = canEditProjectContent(currentRole);

  const handleCreateMilestone = async (data: {
    title: string;
    description: string;
    status: (typeof milestoneStatuses)[number];
    dueDate: string;
  }) => {
    if (!projectId || !canEditMilestones) return;
    await MilestoneService.createMilestone(projectId, data);
    await ProjectService.touchProject(projectId);
  };

  const handleSaveProject = async (name: string, description: string) => {
    if (!projectId || !isOwner) return;
    await ProjectService.updateProject(projectId, { name, description });
  };

  const handleDeleteProject = async () => {
    if (!projectId || !isOwner) return;
    await ProjectService.deleteProjectCascade(projectId);
    router.push("/projects");
  };

  return (
    <AuthGate>
      <div className="grid gap-8">
        <ProjectHeader
          project={project}
          memberCount={project?.memberIds?.length || 0}
          isOwner={isOwner}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
        />

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <MilestoneCreateForm
            onCreate={handleCreateMilestone}
            statusOptions={milestoneStatuses}
            disabled={!canEditMilestones}
          />
          <ProjectMembersPanel
            projectId={projectId || ""}
            project={project}
            members={members}
            isOwner={isOwner}
          />
        </section>

        <MilestoneCalendar
          projectId={projectId || ""}
          milestones={milestones}
        />

        <section className="grid gap-4 md:grid-cols-2">
          {milestones.length === 0 ? (
            <Panel className="p-6 text-sm text-[var(--muted)]">
              No milestones yet. Add the first milestone above.
            </Panel>
          ) : (
            milestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.id}
                projectId={projectId || ""}
                milestone={milestone}
                canEdit={canEditMilestones}
                animationDelayMs={index * 70}
              />
            ))
          )}
        </section>
      </div>
    </AuthGate>
  );
}
