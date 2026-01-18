# CodexTask Notes

## Current Structure Feedback
- Strength: Atomic design keeps UI responsibilities clear and reusable.
- Strength: Service + hook layers keep data access consistent across pages.
- Strength: Realtime workflows (members, tasks, milestones, CSV formats) feel cohesive.
- Risk: Subscribing to the full `users` collection can become expensive at scale.
- Risk: CSV import creates tasks sequentially, which may be slow for large files.
- Risk: Permissions are UI-driven; Firestore rules and server validation are required.

## Improvement Ideas
- Replace global user subscription with server-side search + pagination.
- Batch CSV imports with `writeBatch` or a background job for speed and reliability.
- Add CSV format editing (update name/columns) and sample-row preview.
- Virtualize large task/member lists to keep rendering smooth.
- Document and test Firestore security rules (role-based enforcement).

## Future Features (Concept Fit)
- Milestone timeline/roadmap/Gantt view.
- Task templates, recurring tasks, and sprint planning presets.
- Notifications and reminders (due soon, status changes, mentions).
- Activity log, comments, and change history per task.
- CSV export + integrations (Sheets, Jira/Trello).

## UI/UX Suggestions
- Persist board/table view per milestone.
- Add column pinning/sorting in the table view.
- Highlight due-soon tasks with badges or color states.
- Show a "sample row" preview in CSV import formats.
- Add recent or pinned invite suggestions in the member autocomplete.
