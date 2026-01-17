# TTM UI Structure

This document summarizes the refactor that moved UI logic into atomic design
layers and extracted Firestore operations into service classes.

## Pages (App Router)
- src/app/page.tsx
  - Title/login layout with AuthPanel and onboarding cards.
- src/app/projects/page.tsx
  - Project list and create flow.
- src/app/projects/[projectId]/milestones/page.tsx
  - Project overview, milestones, and member management.
- src/app/projects/[projectId]/milestones/[milestoneId]/page.tsx
  - Task board with filters, details panel, and milestone controls.

## Components (Atomic Design)
### Atoms
- Button, ButtonLink
- Card, Panel, Chip
- InputField, SelectField, TextAreaField
- Avatar

### Molecules
- FormField (label + control pairing)

### Organisms
- Layout/auth: AppShell, AuthGate, AuthPanel
- Projects: ProjectCreateForm, ProjectImportPanel, ProjectCard, ProjectHeader, ProjectMembersPanel
- Milestones: MilestoneCreateForm, MilestoneCard, MilestoneHeader
- Tasks: TaskCreateForm, TaskFilters, TaskBoard, TaskCard, TaskDetailsPanel

### Providers
- AuthProvider

## Services (OOP-style)
- src/lib/services/ProjectService.ts
  - Subscribe to projects, create/update, touch, delete cascade, invite/remove members.
- src/lib/services/MilestoneService.ts
  - Subscribe to milestone list/single, create/update, delete cascade.
- src/lib/services/TaskService.ts
  - Subscribe to tasks, create/update/delete, delete tasks for milestone.
- src/lib/services/UserService.ts
  - Fetch profiles, find user by email.

## Importers
- src/lib/importers/piratesCsv.ts
  - CSV parser for Pirates Design prototype files and task mapping.

## Hooks
- useProjects
- useProject
- useMilestones
- useMilestone
- useTasks
- useMembers

## Data Flow (Summary)
- Pages subscribe to data via hooks.
- Write operations go through service classes.
- Organisms own UI state (edit modes, local form state).
- Atoms and molecules standardize styling and reduce duplication.
