"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { FormField } from "@/components/molecules/FormField";

type ProjectCreateFormProps = {
  onCreate: (name: string, description: string) => Promise<void>;
  disabled?: boolean;
};

export const ProjectCreateForm = ({
  onCreate,
  disabled,
}: ProjectCreateFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const canCreate = useMemo(() => Boolean(name.trim()), [name]);

  const handleCreate = async () => {
    if (!canCreate || disabled) return;
    setSaving(true);
    try {
      await onCreate(name.trim(), description.trim());
      setName("");
      setDescription("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            Projects
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Create a project space and invite collaborators.
          </p>
        </div>
        <Chip>Member-only access</Chip>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_1.8fr_auto] md:items-end">
        <FormField label="Project name">
          <InputField
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New release, core systems, live ops..."
            disabled={disabled}
          />
        </FormField>
        <FormField label="Description (optional)">
          <InputField
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Define scope, goals, and context."
            disabled={disabled}
          />
        </FormField>
        <Button
          variant="primary"
          className="w-full md:w-auto"
          onClick={handleCreate}
          disabled={!canCreate || saving || disabled}
        >
          {saving ? "Creating..." : "Create project"}
        </Button>
      </div>
    </Card>
  );
};
