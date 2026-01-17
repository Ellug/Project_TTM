"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { FormField } from "@/components/molecules/FormField";

type ProjectHeaderProps = {
  project: Project | null;
  memberCount: number;
  isOwner: boolean;
  onSave: (name: string, description: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export const ProjectHeader = ({
  project,
  memberCount,
  isOwner,
  onSave,
  onDelete,
}: ProjectHeaderProps) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (editing) return;
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
  }, [project, editing]);

  const handleSave = async () => {
    if (!name.trim() || !project) return;
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || deleting) return;
    const confirmed = window.confirm(
      `Delete project "${project.name}"? This will remove all milestones and tasks.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Project
          </p>
          {editing ? (
            <div className="mt-3 grid gap-3">
              <FormField label="Project name">
                <InputField
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={!isOwner}
                />
              </FormField>
              <FormField label="Description">
                <InputField
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={!isOwner}
                />
              </FormField>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {project?.name || "Project workspace"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {project?.description || "Define milestones and deliverables."}
              </p>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Chip>{memberCount} members</Chip>
          <ButtonLink href="/projects" variant="secondary" className="text-xs sm:text-sm">
            Back to projects
          </ButtonLink>
          {isOwner && !editing && (
            <Button
              variant="ghost"
              className="text-xs uppercase tracking-[0.2em]"
              onClick={() => setEditing(true)}
            >
              Edit project
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              className="text-xs uppercase tracking-[0.2em] text-[var(--danger)]"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete project"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
