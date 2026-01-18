# TTM UI Structure

This document captures the UI structure, atomic components, and their
connections to reduce future discovery work.

## Pages (App Router)

- `src/app/page.tsx`
  - Entry page with AuthPanel and a feature overview.
  - Uses `Card`, `Panel` atoms for the landing layout and ThemeToggle.
- `src/app/projects/page.tsx`
  - Project list, project creation, and CSV import.
  - Uses `ProjectCreateForm`, `ProjectImportPanel`, and `ProjectCard`.
- `src/app/projects/[projectId]/milestones/page.tsx`
  - Project overview, member management, milestone creation, calendar, and list.
  - Uses `ProjectHeader`, `ProjectMembersPanel`, `MilestoneCreateForm`,
    `MilestoneCalendar`, and `MilestoneCard`.
- `src/app/projects/[projectId]/milestones/[milestoneId]/page.tsx`
  - Milestone task workspace with filters, board/table views, and details panel.
  - Uses `MilestoneHeader`, `TaskCreateForm`, `TaskFilters`, `TaskBoard`,
    `TaskTable`, and `TaskDetailsPanel`.

## Components (Atomic Design)

### Atoms
- Button, ButtonLink (interactive actions and links)
- Card, Panel, Chip (surface + status accents)
- InputField, SelectField, TextAreaField (form controls)
- Avatar (member identity)

### Molecules
- FormField (label + control pairing)
- ThemeToggle (dark/light theme selector)

### Organisms (Roles + Connections)
- AppShell: Global layout wrapper and route-based sizing.
- AuthGate: Guards authenticated routes.
- AuthPanel: Login/register UI.
- ProjectCreateForm: Creates a new project document.
- ProjectImportPanel: CSV import flow, format selection, custom format builder,
  format preview, and import trigger.
- ProjectCard: Project summary and navigation entry.
- ProjectHeader: Project metadata editing and delete actions.
- ProjectMembersPanel: Member list, role updates, invite with autocomplete
  (uses `UserService.subscribeAllUsers`).
- MilestoneCreateForm: Creates milestones (title, status, due date).
- MilestoneCard: Milestone summary and edit/delete actions.
- MilestoneHeader: Milestone details, status edits, and delete actions.
- MilestoneCalendar: Month view with due date highlights and navigation.
- TaskCreateForm: Quick task creation for a milestone.
- TaskFilters: Search, status/priority/assignee filters.
- TaskBoard: Kanban view with drag-and-drop ordering and status changes.
- TaskTable: Excel-style table grouped by Scene (title prefix), drag ordering,
  inline edits for priority/status/assignee.
- TaskCard: Task summary, drag handle, and quick completion toggle.
- TaskDetailsPanel: Markdown details, assignees, and task metadata editing.

### Providers
- AuthProvider (auth state + user profile)
- ThemeProvider (theme state + persistence)

## Services (OOP-style)
- `ProjectService`
  - Subscribe projects, create/update/touch, delete cascade,
    invite/remove members.
- `MilestoneService`
  - Subscribe milestones, create/update, delete cascade.
- `TaskService`
  - Subscribe tasks, create/update/delete, delete tasks for milestone.
- `UserService`
  - Fetch profiles, invite lookup, and realtime user directory subscription.
- `CsvFormatService`
  - Subscribe/create/delete user CSV formats.

## Importers
- `piratesCsv`
  - Default Pirates Design CSV parser.
- `customCsv`
  - Format-driven parser (header name or column index mapping).

## Hooks
- useProjects
- useProject
- useMilestones
- useMilestone
- useTasks
- useMembers

## Data Flow (Summary)
- Pages subscribe via hooks → services → Firestore snapshots.
- Mutations go through service classes for Firestore updates.
- CSV import pipeline: `ProjectImportPanel` → importer → `MilestoneService`
  + `TaskService`.
- Task Board/Table share the same `onUpdate` handler so ordering edits remain
  consistent across views.
