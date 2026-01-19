"use client";

import { useEffect, useState } from "react";
import type { Milestone } from "@/lib/types";
import { milestoneStatuses } from "@/lib/constants";
import { MilestoneService } from "@/lib/services/MilestoneService";
import { toDateString } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";

type MilestoneHeaderProps = {
  projectId: string;
  milestone: Milestone | null;
  canEdit: boolean;
  onDeleted: () => void;
  onUpdated?: (updates: {
    title: string;
    description: string;
    status: Milestone["status"];
    dueDate: string;
  }) => void;
  onExportCsv?: () => void;
};

export const MilestoneHeader = ({
  projectId,
  milestone,
  canEdit,
  onDeleted,
  onUpdated,
  onExportCsv,
}: MilestoneHeaderProps) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [status, setStatus] = useState<Milestone["status"]>(
    milestone?.status ?? "Active"
  );
  const [dueDate, setDueDate] = useState(milestone?.dueDate ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (editing) return;
    setTitle(milestone?.title ?? "");
    setDescription(milestone?.description ?? "");
    setStatus(milestone?.status ?? "Active");
    setDueDate(milestone?.dueDate ?? "");
  }, [milestone, editing]);

  const handleSave = async () => {
    if (!milestone || !title.trim() || !canEdit) return;
    setSaving(true);
    try {
      await MilestoneService.updateMilestone(projectId, milestone.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate,
      });
      setEditing(false);
      onUpdated?.({
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!milestone || deleting || !canEdit) return;
    const confirmed = window.confirm(
      `Delete milestone "${milestone.title}"? This will remove all tasks in it.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await MilestoneService.deleteMilestoneCascade(projectId, milestone.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Milestone
          </p>
          {editing ? (
            <div className="mt-3 grid gap-4">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Status">
                  <SelectField
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as Milestone["status"])
                    }
                    disabled={!canEdit}
                  >
                    {milestoneStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </SelectField>
                </FormField>
                <FormField label="Due date">
                  <InputField
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    disabled={!canEdit}
                  />
                </FormField>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!title.trim() || saving}
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
                {milestone?.title || "Milestone tasks"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {milestone?.description ||
                  "Organize tasks for this delivery window."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                <span>Due {toDateString(milestone?.dueDate)}</span>
                <Chip>{milestone?.status || "Active"}</Chip>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={`/projects/${projectId}/milestones`}
            variant="secondary"
            className="text-xs sm:text-sm"
          >
            Back to milestones
          </ButtonLink>
          <ButtonLink href="/projects" variant="ghost" className="text-xs sm:text-sm">
            Projects
          </ButtonLink>
          {onExportCsv && (
            <Button
              variant="ghost"
              className="text-xs uppercase tracking-[0.2em]"
              onClick={onExportCsv}
            >
              Export CSV
            </Button>
          )}
          {canEdit && !editing && (
            <Button
              variant="ghost"
              className="text-xs uppercase tracking-[0.2em]"
              onClick={() => setEditing(true)}
            >
              Edit milestone
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              className="text-xs uppercase tracking-[0.2em] text-[var(--danger)]"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete milestone"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
