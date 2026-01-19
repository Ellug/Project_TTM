# TTM UI Structure

This document captures the UI structure, atomic components, and their
connections to reduce future discovery work.

## Pages (App Router)

- `src/app/page.tsx`
  - Entry page with AuthPanel and a feature overview.
  - Uses `Card`, `Panel` atoms for the landing layout and ThemeToggle.
- `src/app/profile/page.tsx`
  - User profile page with photo upload and nickname editing.
  - Uses `Avatar`, `ProfileEditForm`, and `AppShell`.
- `src/app/projects/page.tsx`
  - Project list, project creation, and CSV import.
  - Uses `ProjectCreateForm`, `ProjectImportPanel`, and `ProjectCard`.
- `src/app/projects/[projectId]/milestones/page.tsx`
  - Project overview, member management, milestone creation, calendar, and list.
  - Uses `ProjectHeader`, `ProjectMembersPanel`, `MilestoneCreateForm`,
    `ProjectBoard`, `MilestoneCalendar`, and `MilestoneCard`.
- `src/app/projects/[projectId]/milestones/[milestoneId]/page.tsx`
  - Milestone task workspace with filters, board/table views, and details panel.
  - Uses `MilestoneHeader`, `TaskCreateForm`, `TaskFilters`, `TaskBoard`,
    `TaskTable`, and `TaskDetailsPanel`.
- `src/app/projects/[projectId]/milestones/scrum/page.tsx`
  - Daily scrum tracking page with calendar and team member boards.
  - Uses `ScrumCalendar`, `ScrumBoard`, `ScrumItemInput`, and `AuthGate`.

## Components (Atomic Design)

### Atoms
- Button, ButtonLink (interactive actions and links)
- Card, Panel, Chip (surface + status accents)
- InputField, SelectField, TextAreaField (form controls)
- Avatar (member identity)

### Molecules
- FormField (label + control pairing)
- MarkdownEditorPanel (markdown editor + preview + help tooltip)
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
- ProjectBoard: Toggleable project bulletin board with categories, markdown posts,
  and task creation shortcut. Board opens/closes via button, post creation is
  collapsible, and active category filters have visual highlighting with animations.
- ProjectMembersPanel: Member list, role updates, invite with autocomplete
  (uses `UserService.subscribeAllUsers`).
- MilestoneCreateForm: Creates milestones (title, status, due date).
- MilestoneCard: Milestone summary and edit/delete actions.
- MilestoneHeader: Milestone details, status edits, delete actions, and CSV export.
- MilestoneCalendar: Month view with due date highlights and navigation.
- TaskCreateForm: Quick task creation for a milestone.
- TaskFilters: Search, status/priority/assignee filters.
- TaskBoard: Kanban view with drag-and-drop ordering and status changes.
- TaskTable: Excel-style table grouped by Scene (title prefix), drag ordering,
  inline edits for priority/status/assignee.
- TaskCard: Task summary, drag handle, and quick completion toggle.
- TaskDetailsPanel: Markdown details, assignees, task metadata editing, and move to
  other milestones.
- ProfileEditForm: Profile photo upload (with progress), nickname editing,
  and email display (uses `UserService.uploadProfilePhoto`).
- ScrumCalendar: Month view with scrum entry counts and date selection.
- ScrumBoard: Team member panels with scrum items, checkboxes, add/edit/delete,
  and milestone/task selector for adding task references.
- ScrumItemInput: Individual scrum item with checkbox, editable content, delete,
  and task link that opens TaskDetailsPanel when clicked.

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
- `ProjectPostService`
  - Subscribe/create/update/delete project board posts.
- `ScrumService`
  - Subscribe/create/update/delete daily scrum entries.
- `UserService`
  - Fetch profiles, invite lookup, and realtime user directory subscription.
  - Profile photo upload/delete via Firebase Storage.
- `CsvFormatService`
  - Subscribe/create/delete user CSV formats.
- `DiscordService`
  - Sends Discord webhook notifications via `/api/discord-notify`.

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
- useProjectPosts
- useScrums
- useTasks
- useMembers

## Data Flow (Summary)
- Pages subscribe via hooks → services → Firestore snapshots.
- Mutations go through service classes for Firestore updates.
- Notification flow: UI actions → `DiscordService` → `/api/discord-notify`.
- Project board: `ProjectBoard` → `ProjectPostService` + Markdown editor.
- CSV import pipeline: `ProjectImportPanel` → importer → `MilestoneService`
  + `TaskService`.
- Task Board/Table share the same `onUpdate` handler so ordering edits remain
  consistent across views.
- Profile photo upload: `ProfileEditForm` → `UserService.uploadProfilePhoto`
  → Firebase Storage → update `photoURL` in Auth + Firestore.
