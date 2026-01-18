"use client";

import type { Task, CsvFormatColumns } from "@/lib/types";

export type ParsedCsvTask = {
  title: string;
  description: string;
  status: Task["status"];
  completed: boolean;
  order: number;
};

type ProgressMapping = {
  status: Task["status"];
  completed: boolean;
};

type CsvFormatDefinition = {
  hasHeader: boolean;
  columns: CsvFormatColumns;
};

const parseCsv = (input: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (inQuotes) {
      if (char === "\"") {
        if (input[index + 1] === "\"") {
          value += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(value);
      value = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(value);
      rows.push(currentRow);
      currentRow = [];
      value = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    value += char;
  }

  currentRow.push(value);
  rows.push(currentRow);
  return rows;
};

const normalizeCell = (value: string | undefined) =>
  (value ?? "").replace(/\r\n/g, "\n").trim();

const mapProgress = (value: string): ProgressMapping => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return { status: "Backlog", completed: false };
  if (normalized.includes("complete") || normalized.includes("done")) {
    return { status: "Done", completed: true };
  }
  if (normalized.includes("review")) {
    return { status: "Review", completed: false };
  }
  if (normalized.includes("develop") || normalized.includes("progress")) {
    return { status: "In Progress", completed: false };
  }
  if (normalized.includes("ready") || normalized.includes("todo")) {
    return { status: "Backlog", completed: false };
  }
  return { status: "Backlog", completed: false };
};

const buildTitle = (scene: string, category: string, feature: string) => {
  const parts: string[] = [];
  if (scene) parts.push(`[${scene}]`);
  if (category) parts.push(`[${category}]`);
  if (feature) parts.push(feature);
  return parts.join(" ").trim();
};

const buildDescription = (detail: string, logic: string, result: string) => {
  const sections: string[] = [];
  if (detail) sections.push(`### Detail\n${detail}`);
  if (logic) sections.push(`### Logic\n${logic}`);
  if (result) sections.push(`### Result\n${result}`);
  return sections.join("\n\n").trim();
};

const resolveColumnIndex = (
  value: string | undefined,
  headerIndex: Map<string, number>,
  hasHeader: boolean
) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (!hasHeader) return null;
  const normalized = trimmed.toLowerCase();
  return headerIndex.get(normalized) ?? null;
};

const getCellValue = (row: string[], index: number | null) => {
  if (index === null || index === undefined) return "";
  return normalizeCell(row[index]);
};

export const parseCsvWithFormat = (
  input: string,
  format: CsvFormatDefinition
) => {
  const sanitized = input.replace(/^\uFEFF/, "");
  const rows = parseCsv(sanitized).filter((row) =>
    row.some((cell) => cell.trim())
  );

  if (!rows.length) {
    return { tasks: [] as ParsedCsvTask[] };
  }

  const headerRow = format.hasHeader ? rows[0] : [];
  const dataRows = rows.slice(format.hasHeader ? 1 : 0);
  const headerIndex = new Map<string, number>();

  if (format.hasHeader) {
    headerRow.forEach((cell, index) => {
      const key = normalizeCell(cell).toLowerCase();
      if (!key || headerIndex.has(key)) return;
      headerIndex.set(key, index);
    });
  }

  const columnIndexes = {
    scene: resolveColumnIndex(format.columns.scene, headerIndex, format.hasHeader),
    category: resolveColumnIndex(
      format.columns.category,
      headerIndex,
      format.hasHeader
    ),
    feature: resolveColumnIndex(
      format.columns.feature,
      headerIndex,
      format.hasHeader
    ),
    detail: resolveColumnIndex(
      format.columns.detail,
      headerIndex,
      format.hasHeader
    ),
    logic: resolveColumnIndex(
      format.columns.logic,
      headerIndex,
      format.hasHeader
    ),
    progress: resolveColumnIndex(
      format.columns.progress,
      headerIndex,
      format.hasHeader
    ),
    result: resolveColumnIndex(
      format.columns.result,
      headerIndex,
      format.hasHeader
    ),
  };

  const hasSceneMapping = columnIndexes.scene !== null;
  let lastScene = "";
  const tasks: ParsedCsvTask[] = [];
  const baseOrder = Date.now() + dataRows.length;

  dataRows.forEach((row) => {
    const sceneCell = getCellValue(row, columnIndexes.scene);
    if (sceneCell) lastScene = sceneCell;
    const scene = hasSceneMapping ? sceneCell || lastScene : "";
    const category = getCellValue(row, columnIndexes.category);
    const feature = getCellValue(row, columnIndexes.feature);
    const detail = getCellValue(row, columnIndexes.detail);
    const logic = getCellValue(row, columnIndexes.logic);
    const progress = getCellValue(row, columnIndexes.progress);
    const result = getCellValue(row, columnIndexes.result);

    if (!feature) return;

    const title = buildTitle(scene, category, feature);
    const description = buildDescription(detail, logic, result);
    const mapping = mapProgress(progress);
    tasks.push({
      title,
      description,
      status: mapping.status,
      completed: mapping.completed,
      order: baseOrder - tasks.length,
    });
  });

  return { tasks };
};
