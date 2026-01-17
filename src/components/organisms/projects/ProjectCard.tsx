"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectService } from "@/lib/services/ProjectService";
import { toDateString } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { FormField } from "@/components/molecules/FormField";

type ProjectCardProps = {
  project: Project;
  isOwner: boolean;
  animationDelayMs?: number;
};

export const ProjectCard = ({
  project,
  isOwner,
  animationDelayMs,
}: ProjectCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setName(project.name);
    setDescription(project.description || "");
  }, [project, isEditing]);

  const handleSave = async () => {
    if (!isOwner || !name.trim() || saving) return;
    setSaving(true);
    try {
      await ProjectService.updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(project.name);
    setDescription(project.description || "");
  };

  return (
    <Card
      className="flex flex-col gap-4 p-6 animate-fade-in"
      style={animationDelayMs ? { animationDelay: `${animationDelayMs}ms` } : {}}
    >
      {isEditing ? (
        <div className="grid gap-3">
          <FormField label="Project name">
            <InputField
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField label="Description">
            <InputField
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-[var(--text)]">
                {project.name}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {project.description || "No description yet."}
              </p>
            </div>
            <Chip>{project.memberIds?.length || 1} members</Chip>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <span>Updated {toDateString(project.updatedAt)}</span>
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <Button
                  variant="ghost"
                  className="text-xs uppercase tracking-[0.2em]"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
              <ButtonLink
                variant="secondary"
                href={`/projects/${project.id}/milestones`}
              >
                View milestones
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
