"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";

type TaskCreateFormProps = {
  onCreate: (data: {
    title: string;
    priority: Task["priority"];
    dueDate: string;
  }) => Promise<void>;
  priorityOptions: Task["priority"][];
  disabled?: boolean;
};

export const TaskCreateForm = ({
  onCreate,
  priorityOptions,
  disabled,
}: TaskCreateFormProps) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const canCreate = useMemo(() => Boolean(title.trim()), [title]);

  const handleCreate = async () => {
    if (!canCreate || disabled) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        priority,
        dueDate,
      });
      setTitle("");
      setPriority("Medium");
      setDueDate("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--text)]">Create task</h3>
        {disabled && <Chip>Read-only</Chip>}
      </div>
      <div className="mt-4 grid gap-4">
        <FormField label="Title">
          <InputField
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Implement combat loop, UI polish, bugfix..."
            disabled={disabled}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Priority">
            <SelectField
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Task["priority"])
              }
              disabled={disabled}
            >
              {priorityOptions.map((item) => (
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
          {saving ? "Creating..." : "Add task"}
        </Button>
      </div>
    </Card>
  );
};
