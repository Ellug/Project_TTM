"use client";

import { useEffect, useState } from "react";
import type { Milestone } from "@/lib/types";
import { MilestoneService } from "@/lib/services/MilestoneService";
import { toDateString } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { FormField } from "@/components/molecules/FormField";

type MilestoneCardProps = {
  projectId: string;
  milestone: Milestone;
  canEdit: boolean;
  animationDelayMs?: number;
};

export const MilestoneCard = ({
  projectId,
  milestone,
  canEdit,
  animationDelayMs,
}: MilestoneCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [description, setDescription] = useState(milestone.description || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setTitle(milestone.title);
    setDescription(milestone.description || "");
  }, [milestone, isEditing]);

  const handleSave = async () => {
    if (!title.trim() || saving || !canEdit) return;
    setSaving(true);
    try {
      await MilestoneService.updateMilestone(projectId, milestone.id, {
        title: title.trim(),
        description: description.trim(),
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(milestone.title);
    setDescription(milestone.description || "");
  };

  const handleDelete = async () => {
    if (deleting || !canEdit) return;
    const confirmed = window.confirm(
      `Delete milestone "${milestone.title}"? This will remove all tasks in it.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await MilestoneService.deleteMilestoneCascade(projectId, milestone.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      className="flex flex-col gap-4 p-6 animate-fade-in"
      style={animationDelayMs ? { animationDelay: `${animationDelayMs}ms` } : {}}
    >
      {isEditing ? (
        <div className="grid gap-3">
          <FormField label="Title">
            <InputField
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canEdit}
            />
          </FormField>
          <FormField label="Description">
            <InputField
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!canEdit}
            />
          </FormField>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!title.trim() || saving || !canEdit}
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
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-[var(--text)]">
                {milestone.title}
              </h3>
              <Chip>{milestone.status}</Chip>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {milestone.description || "No description yet."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <span>Due {toDateString(milestone.dueDate)}</span>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Button
                  variant="ghost"
                  className="text-xs uppercase tracking-[0.2em]"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  className="text-xs uppercase tracking-[0.2em] text-[var(--danger)]"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              )}
              <ButtonLink
                variant="secondary"
                href={`/projects/${projectId}/milestones/${milestone.id}`}
              >
                Open tasks
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
