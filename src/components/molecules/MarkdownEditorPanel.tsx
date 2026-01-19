"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { Panel } from "@/components/atoms/Panel";
import { TextAreaField } from "@/components/atoms/TextAreaField";
import { remarkDanger } from "@/lib/remark-danger";

type MarkdownPosition = {
  start?: {
    line?: number;
  };
};

type MarkdownNode = {
  position?: MarkdownPosition;
  properties?: {
    className?: string | string[];
  };
};

type MarkdownCheckboxProps = ComponentPropsWithoutRef<"input"> & {
  node?: MarkdownNode;
};

type MarkdownListItemProps = ComponentPropsWithoutRef<"li"> & {
  node?: MarkdownNode;
};

const markdownHelpItems = [
  { label: "Heading", example: "# Title" },
  { label: "Bold / italic", example: "**bold** / *italic*" },
  { label: "Strikethrough", example: "~~deleted~~" },
  { label: "Link", example: "[text](url)" },
  { label: "Inline code", example: "`code`" },
  { label: "Code block", example: "```lang" },
  { label: "List", example: "- item or 1. item" },
  { label: "Checklist", example: "- [ ] task / - [x] done" },
  { label: "Table", example: "| A | B |" },
  { label: "Quote", example: "> quote" },
  { label: "Highlight", example: "%%alert%%" },
];

const checkboxPattern = /^(\s*)([-*+]\s+)?\[(\s|x|X)?\]\s*(.*)$/;

const parseFence = (line: string) => line.match(/^\s*([`~]{3,})/);

const TaskListLineContext = createContext<number | null>(null);

const useTaskListLineIndex = () => useContext(TaskListLineContext);

const getCheckboxStateAtLine = (value: string, lineIndex: number) => {
  const lines = value.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) return null;
  const match = lines[lineIndex].match(checkboxPattern);
  if (!match) return null;
  const mark = match[3] ?? "";
  return mark.trim().toLowerCase() === "x";
};

const normalizeMarkdownCheckboxes = (value: string) => {
  const lines = value.split("\n");
  let inFence = false;
  let fenceChar = "";
  let fenceSize = 0;

  return lines
    .map((line) => {
      const fenceMatch = parseFence(line);
      if (fenceMatch) {
        const fence = fenceMatch[1];
        if (!inFence) {
          inFence = true;
          fenceChar = fence[0];
          fenceSize = fence.length;
        } else if (fence[0] === fenceChar && fence.length >= fenceSize) {
          inFence = false;
          fenceChar = "";
          fenceSize = 0;
        }
        return line;
      }
      if (inFence) return line;
      const match = line.match(checkboxPattern);
      if (!match) return line;
      const indent = match[1] ?? "";
      const listMarker = match[2] ?? "";
      const mark = match[3] ?? "";
      const content = match[4] ?? "";
      const checked = mark.trim().toLowerCase() === "x";
      const bracket = checked ? "[x]" : "[ ]";
      const prefix = listMarker.trim().length ? listMarker : "- ";
      return `${indent}${prefix}${bracket}${content ? ` ${content}` : ""}`;
    })
    .join("\n");
};

const findCheckboxLineIndex = (value: string, targetOrder: number) => {
  const lines = value.split("\n");
  let inFence = false;
  let fenceChar = "";
  let fenceSize = 0;
  let order = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = parseFence(line);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceChar = fence[0];
        fenceSize = fence.length;
      } else if (fence[0] === fenceChar && fence.length >= fenceSize) {
        inFence = false;
        fenceChar = "";
        fenceSize = 0;
      }
      continue;
    }
    if (inFence) continue;
    if (checkboxPattern.test(line)) {
      if (order === targetOrder) {
        return index;
      }
      order += 1;
    }
  }

  return undefined;
};

const toggleCheckboxLine = (
  value: string,
  lineIndex: number,
  nextChecked: boolean
) => {
  const lines = value.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) return value;

  let inFence = false;
  let fenceChar = "";
  let fenceSize = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = parseFence(line);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceChar = fence[0];
        fenceSize = fence.length;
      } else if (fence[0] === fenceChar && fence.length >= fenceSize) {
        inFence = false;
        fenceChar = "";
        fenceSize = 0;
      }
    }
    if (index === lineIndex) {
      if (inFence) return value;
      const match = line.match(checkboxPattern);
      if (!match) return value;
      const indent = match[1] ?? "";
      const listMarker = match[2] ?? "";
      const content = match[4] ?? "";
      const marker = nextChecked ? "[x]" : "[ ]";
      const prefix = listMarker ? `${indent}${listMarker}` : indent;
      lines[index] = `${prefix}${marker}${content ? ` ${content}` : ""}`;
      break;
    }
  }

  return lines.join("\n");
};

type MarkdownPreviewProps = {
  value: string;
  canEdit?: boolean;
  onChange?: (nextValue: string) => void;
  onAutoSave?: (nextValue: string) => void;
  className?: string;
  emptyText?: string;
};

export const MarkdownPreview = ({
  value,
  canEdit,
  onChange,
  onAutoSave,
  className,
  emptyText,
}: MarkdownPreviewProps) => {
  const [localValue, setLocalValue] = useState(value);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
    setLocalValue(value);
  }, [value]);

  const renderedValue = useMemo(
    () => normalizeMarkdownCheckboxes(localValue),
    [localValue]
  );
  const checkboxIndexRef = useRef(0);
  checkboxIndexRef.current = 0;

  const handleToggleCheckbox = (lineIndex: number, nextChecked: boolean) => {
    if (!canEdit) return;
    const nextDescription = toggleCheckboxLine(
      valueRef.current,
      lineIndex,
      nextChecked
    );
    if (nextDescription === valueRef.current) return;
    valueRef.current = nextDescription;
    setLocalValue(nextDescription);
    onChange?.(nextDescription);
    onAutoSave?.(nextDescription);
  };

  return (
    <div className={clsx( "markdown text-sm text-[var(--text)] max-h-[500px] overflow-y-auto", className)}>
      <ReactMarkdown
        remarkPlugins={[
          [remarkGfm, { singleTilde: false }],
          remarkBreaks,
          remarkDanger,
        ]}
        components={{
          input: ({ node, ...props }: MarkdownCheckboxProps) => {
            const lineIndexFromContext = useTaskListLineIndex();
            if (props.type !== "checkbox") {
              return <input {...props} />;
            }
            const checkboxOrder = checkboxIndexRef.current;
            checkboxIndexRef.current += 1;
            const lineIndexFromNode = node?.position?.start?.line
              ? node.position.start.line - 1
              : undefined;
            const lineIndex =
              lineIndexFromContext ??
              lineIndexFromNode ??
              findCheckboxLineIndex(localValue, checkboxOrder);
            const canToggle =
              Boolean(canEdit) &&
              typeof lineIndex === "number" &&
              lineIndex >= 0;
            const lineChecked =
              typeof lineIndex === "number"
                ? getCheckboxStateAtLine(localValue, lineIndex)
                : null;
            const isChecked = lineChecked ?? Boolean(props.checked);
            return (
              <input
                {...props}
                type="checkbox"
                checked={isChecked}
                disabled={!canToggle}
                readOnly
                onClick={(event) => {
                  if (!canEdit) return;
                  event.preventDefault();
                  const resolvedLineIndex =
                    typeof lineIndex === "number"
                      ? lineIndex
                      : findCheckboxLineIndex(valueRef.current, checkboxOrder);
                  if (resolvedLineIndex === undefined) return;
                  handleToggleCheckbox(resolvedLineIndex, !isChecked);
                }}
                onKeyDown={(event) => {
                  if (!canEdit) return;
                  if (event.key !== " " && event.key !== "Enter") return;
                  event.preventDefault();
                  const resolvedLineIndex =
                    typeof lineIndex === "number"
                      ? lineIndex
                      : findCheckboxLineIndex(valueRef.current, checkboxOrder);
                  if (resolvedLineIndex === undefined) return;
                  handleToggleCheckbox(resolvedLineIndex, !isChecked);
                }}
              />
            );
          },
          li: ({ node, children, ...props }: MarkdownListItemProps) => {
            const classNames = node?.properties?.className;
            const classList = Array.isArray(classNames)
              ? classNames
              : typeof classNames === "string"
                ? classNames.split(" ")
                : [];
            const isTaskItem = classList.includes("task-list-item");
            if (!isTaskItem) {
              return <li {...props}>{children}</li>;
            }
            const lineIndex = node?.position?.start?.line
              ? node.position.start.line - 1
              : null;
            return (
              <li {...props}>
                <TaskListLineContext.Provider value={lineIndex}>
                  {children}
                </TaskListLineContext.Provider>
              </li>
            );
          },
        }}
      >
        {renderedValue || emptyText || "No details yet. Switch to edit mode."}
      </ReactMarkdown>
    </div>
  );
};

type MarkdownEditorPanelProps = {
  value: string;
  onChange: (nextValue: string) => void;
  canEdit?: boolean;
  onSave?: () => Promise<void> | void;
  onAutoSave?: (nextValue: string) => void;
  saving?: boolean;
  allowModeToggle?: boolean;
  initialMode?: "preview" | "edit";
  placeholder?: string;
  hint?: string;
  emptyText?: string;
  headerLabel?: string;
  resetKey?: string | number | null;
  className?: string;
};

export const MarkdownEditorPanel = ({
  value,
  onChange,
  canEdit = true,
  onSave,
  onAutoSave,
  saving,
  allowModeToggle = true,
  initialMode = "preview",
  placeholder = "Write markdown details...",
  hint = "Preview supports tables, code blocks, %%alert%%, and checklists: [] or [x] (start a line and click to toggle).",
  emptyText,
  headerLabel = "Details",
  resetKey,
  className,
}: MarkdownEditorPanelProps) => {
  const [mode, setMode] = useState<"preview" | "edit">(initialMode);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const markdownHelpRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canEdit) {
      setMode("preview");
    }
  }, [canEdit]);

  useEffect(() => {
    if (resetKey === undefined) return;
    setMode(initialMode);
    setShowMarkdownHelp(false);
  }, [resetKey, initialMode]);

  useEffect(() => {
    if (!showMarkdownHelp) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !markdownHelpRef.current) return;
      if (markdownHelpRef.current.contains(target)) return;
      setShowMarkdownHelp(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showMarkdownHelp]);

  const handleSave = async () => {
    if (!onSave) return;
    try {
      await onSave();
      setMode("preview");
    } catch {
      // Ignore save errors here; caller handles feedback.
    }
  };

  return (
    <Panel className={clsx("markdown-panel p-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {headerLabel}
          </p>
          <Chip>Markdown</Chip>
          <div className="relative" ref={markdownHelpRef}>
            <Button
              type="button"
              variant="ghost"
              className="!px-2 !py-1 text-[10px] uppercase tracking-[0.2em]"
              aria-expanded={showMarkdownHelp}
              aria-haspopup="true"
              onClick={() => setShowMarkdownHelp((prev) => !prev)}
            >
              Help
            </Button>
            {showMarkdownHelp && (
              <div
                className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)] shadow-[var(--shadow)]"
                role="tooltip"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text)]">
                  Markdown guide
                </p>
                <ul className="mt-2 grid gap-2">
                  {markdownHelpItems.map((item) => (
                    <li
                      key={item.label}
                      className="grid grid-cols-[110px_1fr] items-start gap-2"
                    >
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        {item.label}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text)]">
                        {item.example}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {allowModeToggle && canEdit && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className={clsx(
                "text-xs uppercase tracking-[0.2em]",
                mode === "preview" && "text-[var(--text)]"
              )}
              onClick={() => setMode("preview")}
            >
              Preview
            </Button>
            <Button
              variant="ghost"
              className={clsx(
                "text-xs uppercase tracking-[0.2em]",
                mode === "edit" && "text-[var(--text)]"
              )}
              onClick={() => setMode("edit")}
            >
              Edit
            </Button>
          </div>
        )}
      </div>
      {mode === "edit" ? (
        <TextAreaField
          className="markdown-input mt-3 text-xs"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={!canEdit}
        />
      ) : (
        <MarkdownPreview
          value={value}
          canEdit={canEdit}
          onChange={onChange}
          onAutoSave={onAutoSave}
          className="mt-3"
          emptyText={emptyText}
        />
      )}
      {mode === "edit" && canEdit && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {onSave && (
            <Button
              variant="primary"
              className="text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save details"}
            </Button>
          )}
          <span className="text-xs text-[var(--muted)]">{hint}</span>
        </div>
      )}
    </Panel>
  );
};
