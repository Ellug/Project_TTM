"use client";

import type { Task } from "@/lib/types";

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

export const parsePiratesCsv = (input: string) => {
  const sanitized = input.replace(/^\uFEFF/, "");
  const rows = parseCsv(sanitized).filter((row) =>
    row.some((cell) => cell.trim())
  );

  if (!rows.length) {
    return { tasks: [] as ParsedCsvTask[] };
  }

  const headerRow = rows[0];
  const hasHeader = headerRow.some(
    (cell) => normalizeCell(cell).toLowerCase() === "scene"
  );
  const dataRows = rows.slice(hasHeader ? 1 : 0);
  let lastScene = "";
  const tasks: ParsedCsvTask[] = [];
  const baseOrder = Date.now() + dataRows.length;

  dataRows.forEach((row) => {
    const sceneCell = normalizeCell(row[0]);
    if (sceneCell) lastScene = sceneCell;
    const scene = sceneCell || lastScene;
    const category = normalizeCell(row[1]);
    const feature = normalizeCell(row[2]);
    const detail = normalizeCell(row[3]);
    const logic = normalizeCell(row[4]);
    const progress = normalizeCell(row[5]);
    const result = normalizeCell(row[7]);

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
