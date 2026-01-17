"use client";

import type { Task, UserProfile } from "@/lib/types";
import { Button } from "@/components/atoms/Button";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";

type TaskFiltersProps = {
  search: string;
  statusFilter: string;
  priorityFilter: string;
  assigneeFilter: string;
  members: UserProfile[];
  statusOptions: Task["status"][];
  priorityOptions: Task["priority"][];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onClear: () => void;
};

export const TaskFilters = ({
  search,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  members,
  statusOptions,
  priorityOptions,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onClear,
}: TaskFiltersProps) => {
  return (
    <Panel className="p-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">Filters</h3>
      <div className="mt-4 grid gap-4 text-sm text-[var(--muted)]">
        <FormField label="Search">
          <InputField
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Find tasks"
          />
        </FormField>
        <FormField label="Status">
          <SelectField
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="All">All</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </FormField>
        <FormField label="Priority">
          <SelectField
            value={priorityFilter}
            onChange={(event) => onPriorityChange(event.target.value)}
          >
            <option value="All">All</option>
            {priorityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </FormField>
        <FormField label="Assignee">
          <SelectField
            value={assigneeFilter}
            onChange={(event) => onAssigneeChange(event.target.value)}
          >
            <option value="All">All</option>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.nickname || member.displayName || "User"}
              </option>
            ))}
          </SelectField>
        </FormField>
        <Button
          type="button"
          variant="ghost"
          className="text-xs uppercase tracking-[0.2em]"
          onClick={onClear}
        >
          Clear filters
        </Button>
      </div>
    </Panel>
  );
};
