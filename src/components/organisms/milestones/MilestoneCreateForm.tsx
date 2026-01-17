"use client";

import { useMemo, useState } from "react";
import type { Milestone } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";

type MilestoneCreateFormProps = {
  onCreate: (data: {
    title: string;
    description: string;
    status: Milestone["status"];
    dueDate: string;
  }) => Promise<void>;
  statusOptions: Milestone["status"][];
  disabled?: boolean;
};

export const MilestoneCreateForm = ({
  onCreate,
  statusOptions,
  disabled,
}: MilestoneCreateFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Milestone["status"]>("Planned");
  const [saving, setSaving] = useState(false);

  const canCreate = useMemo(() => Boolean(title.trim()), [title]);

  const handleCreate = async () => {
    if (!canCreate || disabled) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setStatus("Planned");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Create milestone
        </h3>
        {disabled && <Chip>Read-only</Chip>}
      </div>
      <div className="mt-4 grid gap-4">
        <FormField label="Title">
          <InputField
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Vertical slice, alpha, content lock..."
            disabled={disabled}
          />
        </FormField>
        <FormField label="Description">
          <InputField
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Scope, deliverables, or exit criteria."
            disabled={disabled}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Status">
            <SelectField
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Milestone["status"])
              }
              disabled={disabled}
            >
              {statusOptions.map((item) => (
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
              disabled={disabled}
            />
          </FormField>
        </div>
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          onClick={handleCreate}
          disabled={!canCreate || saving || disabled}
        >
          {saving ? "Creating..." : "Add milestone"}
        </Button>
      </div>
    </Card>
  );
};
