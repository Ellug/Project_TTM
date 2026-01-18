"use client";

import { AuthGate } from "@/components/organisms/AuthGate";
import { ProjectCard } from "@/components/organisms/projects/ProjectCard";
import { ProjectCreateForm } from "@/components/organisms/projects/ProjectCreateForm";
import { ProjectImportPanel } from "@/components/organisms/projects/ProjectImportPanel";
import { Panel } from "@/components/atoms/Panel";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProjects } from "@/lib/hooks/useProjects";
import { ProjectService } from "@/lib/services/ProjectService";
import { DiscordService } from "@/lib/services/DiscordService";

export default function ProjectsPage() {
  const { user, profile } = useAuth();
  const projects = useProjects(user?.uid);

  const handleCreate = async (name: string, description: string) => {
    if (!user) return;
    await ProjectService.createProject({
      name,
      description,
      ownerId: user.uid,
    });
    const userName = profile?.nickname || profile?.displayName || "Unknown";
    void DiscordService.notifyProjectCreated(userName, name);
  };

  return (
    <AuthGate>
      <div className="grid gap-8">
        <ProjectCreateForm onCreate={handleCreate} disabled={!user} />
        <ProjectImportPanel projects={projects} />

        <section className="grid gap-4 md:grid-cols-2">
          {projects.length === 0 ? (
            <Panel className="p-6 text-sm text-[var(--muted)]">
              No projects yet. Create your first workspace above.
            </Panel>
          ) : (
            projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                isOwner={user?.uid === project.ownerId}
                animationDelayMs={index * 60}
              />
            ))
          )}
        </section>
      </div>
    </AuthGate>
  );
}
