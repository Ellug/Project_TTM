"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { AuthGate } from "@/components/organisms/AuthGate";
import { ScrumCalendar } from "@/components/organisms/scrums/ScrumCalendar";
import { ScrumBoard } from "@/components/organisms/scrums/ScrumBoard";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Card } from "@/components/atoms/Card";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProject } from "@/lib/hooks/useProject";
import { useMembers } from "@/lib/hooks/useMembers";
import { useScrums } from "@/lib/hooks/useScrums";

const padNumber = (value: number) => value.toString().padStart(2, "0");

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  return `${year}-${month}-${day}`;
};

export default function ScrumPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const { user, profile } = useAuth();

  const project = useProject(projectId);
  const members = useMembers(project?.memberIds);
  const scrums = useScrums(projectId);

  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    formatDateKey(new Date())
  );

  const currentUserName = profile?.nickname || profile?.displayName || "Unknown";
  const currentUserPhotoURL = profile?.photoURL;

  return (
    <AuthGate>
      <div className="grid gap-8">
        <Card className="p-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                {project?.name || "Project"}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-[var(--text)]">
                Daily Scrum
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Track daily progress for your team members.
              </p>
            </div>
            <ButtonLink
              href={`/projects/${projectId}/milestones`}
              variant="secondary"
              className="text-xs uppercase tracking-[0.2em]"
            >
              Back to Milestones
            </ButtonLink>
          </div>
        </Card>

        <ScrumCalendar
          scrums={scrums}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {selectedDate && (
          <ScrumBoard
            projectId={projectId || ""}
            selectedDate={selectedDate}
            scrums={scrums}
            members={members}
            currentUserId={user?.uid}
            currentUserName={currentUserName}
            currentUserPhotoURL={currentUserPhotoURL}
          />
        )}
      </div>
    </AuthGate>
  );
}
