"use client";

import { useEffect, useMemo, useState } from "react";
import type { CsvFormat, CsvFormatColumns, Project } from "@/lib/types";
import { parsePiratesCsv } from "@/lib/importers/piratesCsv";
import { parseCsvWithFormat } from "@/lib/importers/customCsv";
import { CsvFormatService } from "@/lib/services/CsvFormatService";
import { MilestoneService } from "@/lib/services/MilestoneService";
import { ProjectService } from "@/lib/services/ProjectService";
import { TaskService } from "@/lib/services/TaskService";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";

type ProjectImportPanelProps = {
  projects: Project[];
};

const createDefaultColumns = (): CsvFormatColumns => ({
  scene: "Scene",
  category: "Category",
  feature: "Feature",
  detail: "Detail",
  logic: "Logic",
  progress: "Progress",
  result: "Result",
});

const defaultFormatName = "Default";

const describeColumnSource = (value?: string) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "Not mapped";
  if (/^\d+$/.test(trimmed)) {
    return `Column #${trimmed}`;
  }
  return `Header "${trimmed}"`;
};

const formatFields: Array<{
  key: keyof CsvFormatColumns;
  label: string;
  placeholder: string;
}> = [
  { key: "scene", label: "Scene column", placeholder: "Scene or 0" },
  { key: "category", label: "Category column", placeholder: "Category or 1" },
  { key: "feature", label: "Feature column", placeholder: "Feature or 2" },
  { key: "detail", label: "Detail column", placeholder: "Detail or 3" },
  { key: "logic", label: "Logic column", placeholder: "Logic or 4" },
  { key: "progress", label: "Progress column", placeholder: "Progress or 5" },
  { key: "result", label: "Result column", placeholder: "Result or 7" },
];

const deriveMilestoneTitle = (fileName: string) => {
  const trimmed = fileName.trim();
  if (!trimmed) return "Imported CSV";
  return trimmed.replace(/\.[^/.]+$/, "") || "Imported CSV";
};

export const ProjectImportPanel = ({ projects }: ProjectImportPanelProps) => {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [formats, setFormats] = useState<CsvFormat[]>([]);
  const [formatsReady, setFormatsReady] = useState(false);
  const [seedingDefault, setSeedingDefault] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customHasHeader, setCustomHasHeader] = useState(true);
  const [customColumns, setCustomColumns] = useState<CsvFormatColumns>(() =>
    createDefaultColumns()
  );
  const [formatMessage, setFormatMessage] = useState("");
  const [formatError, setFormatError] = useState("");
  const [savingFormat, setSavingFormat] = useState(false);
  const [deletingFormat, setDeletingFormat] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!user) {
      setFormats([]);
      setFormatsReady(false);
      return;
    }
    const unsubscribe = CsvFormatService.subscribeFormats(
      user.uid,
      (items) => {
        setFormats(items);
        setFormatsReady(true);
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!formats.length) return;
    if (!selectedFormatId) {
      setSelectedFormatId(formats[0].id);
      return;
    }
    const exists = formats.some((format) => format.id === selectedFormatId);
    if (!exists) {
      setSelectedFormatId(formats[0].id);
    }
  }, [formats, selectedFormatId]);

  useEffect(() => {
    if (!user || !formatsReady || seedingDefault) return;
    const hasDefault = formats.some(
      (format) => format.name === defaultFormatName
    );
    if (hasDefault) return;
    setSeedingDefault(true);
    CsvFormatService.createFormat(user.uid, {
      name: defaultFormatName,
      hasHeader: true,
      columns: createDefaultColumns(),
    })
      .catch(() => {})
      .finally(() => {
        setSeedingDefault(false);
      });
  }, [formats, formatsReady, seedingDefault, user]);

  const formatOptions = useMemo(
    () => formats.map((format) => ({ id: format.id, name: format.name })),
    [formats]
  );

  const activeCustomFormat = useMemo(
    () => formats.find((format) => format.id === selectedFormatId) ?? null,
    [formats, selectedFormatId]
  );
  const isDefaultFormat =
    activeCustomFormat?.name === defaultFormatName;

  const formatPreview = useMemo(() => {
    if (!activeCustomFormat) return null;
    const { columns } = activeCustomFormat;
    return [
      {
        field: "Title",
        source: `Scene: ${describeColumnSource(columns.scene)}, Category: ${describeColumnSource(
          columns.category
        )}, Feature: ${describeColumnSource(columns.feature)}`,
      },
      {
        field: "Description",
        source: `Detail: ${describeColumnSource(
          columns.detail
        )}, Logic: ${describeColumnSource(
          columns.logic
        )}, Result: ${describeColumnSource(columns.result)}`,
      },
      {
        field: "Status / Completed",
        source: `Progress: ${describeColumnSource(columns.progress)}`,
      },
      {
        field: "Order",
        source: "Row order (top to bottom)",
      },
      {
        field: "Priority",
        source: "Default: Medium",
      },
      {
        field: "Due date",
        source: "Empty",
      },
      {
        field: "Assignees",
        source: "None",
      },
    ];
  }, [activeCustomFormat]);

  const canImport = useMemo(
    () =>
      Boolean(
        user &&
          selectedProjectId &&
          selectedFormatId &&
          file &&
          !importing
      ),
    [user, selectedProjectId, selectedFormatId, file, importing]
  );

  const canSaveFormat = useMemo(() => {
    if (!user || savingFormat) return false;
    return Boolean(customName.trim() && customColumns.feature?.trim());
  }, [customColumns.feature, customName, savingFormat, user]);

  const canDeleteFormat = Boolean(
    user &&
      activeCustomFormat &&
      !isDefaultFormat &&
      !deletingFormat
  );

  const handleCreateFormat = async () => {
    if (!user || savingFormat) return;
    const trimmedName = customName.trim();
    const columns: CsvFormatColumns = {
      scene: customColumns.scene?.trim() || undefined,
      category: customColumns.category?.trim() || undefined,
      feature: customColumns.feature?.trim() || undefined,
      detail: customColumns.detail?.trim() || undefined,
      logic: customColumns.logic?.trim() || undefined,
      progress: customColumns.progress?.trim() || undefined,
      result: customColumns.result?.trim() || undefined,
    };
    if (!trimmedName) {
      setFormatError("Format name is required.");
      setFormatMessage("");
      return;
    }
    if (!columns.feature) {
      setFormatError("Feature column is required.");
      setFormatMessage("");
      return;
    }
    setSavingFormat(true);
    setFormatError("");
    setFormatMessage("");
    try {
      const docRef = await CsvFormatService.createFormat(user.uid, {
        name: trimmedName,
        hasHeader: customHasHeader,
        columns,
      });
      setSelectedFormatId(docRef.id);
      setFormatMessage(`Saved format "${trimmedName}".`);
      setCustomName("");
      setCustomHasHeader(true);
      setCustomColumns(createDefaultColumns());
      setIsCustomOpen(false);
    } catch (error) {
      setFormatError(
        error instanceof Error ? error.message : "Failed to save format."
      );
    } finally {
      setSavingFormat(false);
    }
  };

  const handleDeleteFormat = async () => {
    if (!user || !activeCustomFormat || isDefaultFormat || deletingFormat) {
      return;
    }
    const confirmed = window.confirm(
      `Delete format "${activeCustomFormat.name}"?`
    );
    if (!confirmed) return;
    setDeletingFormat(true);
    setFormatError("");
    setFormatMessage("");
    try {
      await CsvFormatService.deleteFormat(user.uid, activeCustomFormat.id);
      setSelectedFormatId("");
      setFormatMessage(`Deleted format "${activeCustomFormat.name}".`);
    } catch (error) {
      setFormatError(
        error instanceof Error ? error.message : "Failed to delete format."
      );
    } finally {
      setDeletingFormat(false);
    }
  };

  const handleImport = async () => {
    if (!user || !selectedProjectId || !file || importing) return;
    setImporting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const text = await file.text();
      const result = activeCustomFormat
        ? parseCsvWithFormat(text, activeCustomFormat)
        : parsePiratesCsv(text);
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
            Upload a CSV and generate a milestone with tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip>CSV importer</Chip>
          <Button
            variant="ghost"
            className="text-xs uppercase tracking-[0.2em]"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
          >
            {isOpen ? "Hide" : "Show"}
          </Button>
        </div>
      </div>

      {isOpen && (
        <>
          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Create a project first to import a milestone.
            </p>
          ) : (
            <div className="mt-5 grid gap-5">
              <div className="grid gap-4 md:grid-cols-[1.1fr_1.1fr_auto_auto] md:items-end">
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
                <FormField label="CSV format">
                  <SelectField
                    value={selectedFormatId}
                    onChange={(event) => {
                      setSelectedFormatId(event.target.value);
                      setStatusMessage("");
                      setErrorMessage("");
                    }}
                  >
                    {formatOptions.length === 0 ? (
                      <option value="">Loading formats...</option>
                    ) : (
                      formatOptions.map((format) => (
                        <option key={format.id} value={format.id}>
                          {format.name}
                        </option>
                      ))
                    )}
                  </SelectField>
                </FormField>
                <Button
                  variant="secondary"
                  className="w-full md:w-auto"
                  onClick={() => setIsCustomOpen((prev) => !prev)}
                >
                  {isCustomOpen ? "Hide custom CSV" : "Custom CSV"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full md:w-auto text-[var(--danger)]"
                  onClick={handleDeleteFormat}
                  disabled={!canDeleteFormat}
                >
                  {deletingFormat ? "Deleting..." : "Delete format"}
                </Button>
              </div>

              {isCustomOpen && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Format name">
                      <InputField
                        value={customName}
                        onChange={(event) => setCustomName(event.target.value)}
                        placeholder="My studio CSV"
                      />
                    </FormField>
                    <FormField label="Header row">
                      <SelectField
                        value={customHasHeader ? "yes" : "no"}
                        onChange={(event) =>
                          setCustomHasHeader(event.target.value === "yes")
                        }
                      >
                        <option value="yes">Has header row</option>
                        <option value="no">No header row</option>
                      </SelectField>
                    </FormField>
                  </div>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Map each field to a header name or a zero-based column index.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {formatFields.map((field) => (
                      <FormField key={field.key} label={field.label}>
                        <InputField
                          value={customColumns[field.key] ?? ""}
                          onChange={(event) =>
                            setCustomColumns((prev) => ({
                              ...prev,
                              [field.key]: event.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                        />
                      </FormField>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      variant="primary"
                      onClick={handleCreateFormat}
                      disabled={!canSaveFormat}
                    >
                      {savingFormat ? "Saving..." : "Save format"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsCustomOpen(false)}
                    >
                      Cancel
                    </Button>
                    {formatError && (
                      <span className="text-xs text-[var(--danger)]">
                        {formatError}
                      </span>
                    )}
                    {formatMessage && (
                      <span className="text-xs text-[var(--muted)]">
                        {formatMessage}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Panel className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Import preview
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--text)]">
                      How this format maps into tasks
                    </h3>
                  </div>
                  <Chip>
                    {activeCustomFormat?.hasHeader ? "Header row" : "No header"}
                  </Chip>
                </div>
                {formatPreview ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        <tr>
                          <th className="border-b border-[var(--border)] pb-2 pr-3">
                            Task field
                          </th>
                          <th className="border-b border-[var(--border)] pb-2">
                            CSV source
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formatPreview.map((row) => (
                          <tr
                            key={row.field}
                            className="border-b border-[var(--border)]"
                          >
                            <td className="py-2 pr-3 text-sm font-semibold text-[var(--text)]">
                              {row.field}
                            </td>
                            <td className="py-2 text-xs text-[var(--muted)]">
                              {row.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Select a format to preview the mapping.
                  </p>
                )}
              </Panel>

              <div className="grid gap-4 md:grid-cols-[1.8fr_auto] md:items-end">
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
        </>
      )}
    </Card>
  );
};
