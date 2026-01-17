"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { parsePiratesCsv } from "@/lib/importers/piratesCsv";
import { MilestoneService } from "@/lib/services/MilestoneService";
import { ProjectService } from "@/lib/services/ProjectService";
import { TaskService } from "@/lib/services/TaskService";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";

type ProjectImportPanelProps = {
  projects: Project[];
};

const deriveMilestoneTitle = (fileName: string) => {
  const trimmed = fileName.trim();
  if (!trimmed) return "Imported CSV";
  return trimmed.replace(/\.[^/.]+$/, "") || "Imported CSV";
};

export const ProjectImportPanel = ({ projects }: ProjectImportPanelProps) => {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const canImport = useMemo(
    () => Boolean(user && selectedProjectId && file && !importing),
    [user, selectedProjectId, file, importing]
  );

  const handleImport = async () => {
    if (!user || !selectedProjectId || !file || importing) return;
    setImporting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const text = await file.text();
      const result = parsePiratesCsv(text);
      if (!result.tasks.length) {
        setErrorMessage("No tasks found in the CSV.");
        return;
      }

      const milestoneTitle = deriveMilestoneTitle(file.name);
      const milestoneRef = await MilestoneService.createMilestone(
        selectedProjectId,
        {
          title: milestoneTitle,
          description: `Imported from ${file.name}`,
          status: "Active",
          dueDate: "",
        }
      );

      for (const [index, task] of result.tasks.entries()) {
        await TaskService.createTask(selectedProjectId, milestoneRef.id, {
          title: task.title,
          description: task.description,
          priority: "Medium",
          dueDate: "",
          creatorId: user.uid,
          status: task.status,
          completed: task.completed,
          order: task.order ?? Date.now() + result.tasks.length - index,
        });
      }

      await ProjectService.touchProject(selectedProjectId);
      setStatusMessage(
        `Imported ${result.tasks.length} tasks into "${milestoneTitle}".`
      );
      setFile(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import failed.";
      setErrorMessage(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            Import CSV
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Upload a Pirates Design CSV and generate a milestone with tasks.
          </p>
        </div>
        <Chip>CSV importer</Chip>
      </div>

      {projects.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Create a project first to import a milestone.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_1.8fr_auto] md:items-end">
          <FormField label="Target project">
            <SelectField
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </SelectField>
          </FormField>
          <FormField label="CSV file">
            <InputField
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setStatusMessage("");
                setErrorMessage("");
              }}
            />
          </FormField>
          <Button
            variant="primary"
            className="w-full md:w-auto"
            onClick={handleImport}
            disabled={!canImport}
          >
            {importing ? "Importing..." : "Import tasks"}
          </Button>
        </div>
      )}

      {(statusMessage || errorMessage) && (
        <p
          className="mt-4 text-sm"
          style={{ color: errorMessage ? "var(--danger)" : "var(--muted)" }}
        >
          {errorMessage || statusMessage}
        </p>
      )}
    </Card>
  );
};
