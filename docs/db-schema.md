# Firestore Data Model

## Collections

### users/{uid}
- uid: string
- email: string
- displayName: string
- nickname: string
- photoURL: string
- createdAt: timestamp
- updatedAt: timestamp

### projects/{projectId}
- name: string
- description: string
- ownerId: string
- memberIds: string[]
- createdAt: timestamp
- updatedAt: timestamp

### projects/{projectId}/milestones/{milestoneId}
- title: string
- description: string
- status: "Planned" | "Active" | "Complete"
- dueDate: string (YYYY-MM-DD)
- createdAt: timestamp
- updatedAt: timestamp

### projects/{projectId}/milestones/{milestoneId}/tasks/{taskId}
- title: string
- description: string (markdown)
- status: "Backlog" | "In Progress" | "Review" | "Done"
- priority: "Low" | "Medium" | "High"
- completed: boolean
- assigneeIds: string[]
- labels: string[]
- dueDate: string (YYYY-MM-DD)
- creatorId: string
- createdAt: timestamp
- updatedAt: timestamp

## Access control
- Only authenticated users can read profiles (`users`).
- Projects are readable only by members (memberIds includes uid).
- Project ownership (ownerId) controls project metadata and membership edits.
- Milestones and tasks are readable and writable by project members.

See `firestore.rules` for the exact rules.
