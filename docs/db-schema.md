# Database Schema

This document outlines the Firestore collections and Firebase Storage structure used by the app.

## Collections

### `users`

Stores user profile information.

| Field         | Type         | Description                                  |
|---------------|--------------|----------------------------------------------|
| `uid`         | `string`     | The user's unique ID from Firebase Auth.     |
| `email`       | `string`     | The user's email address.                    |
| `displayName` | `string`     | The user's display name.                     |
| `nickname`    | `string`     | The user's nickname.                         |
| `photoURL`    | `string`     | URL for the user's profile picture.          |
| `createdAt`   | `Timestamp`  | The timestamp when the user was created.     |
| `updatedAt`   | `Timestamp`  | The timestamp when the user was last updated.|

#### Subcollections

##### `users/{uid}/csvFormats`

Stores custom CSV formats for imports.

| Field       | Type         | Description                                               |
|-------------|--------------|-----------------------------------------------------------|
| `name`      | `string`     | Display name for the format.                              |
| `hasHeader` | `boolean`    | Whether the CSV includes a header row.                    |
| `columns`   | `map`        | Column mapping (see below).                               |
| `ownerId`   | `string`     | Owner UID (same as `users/{uid}`).                        |
| `createdAt` | `Timestamp`  | The timestamp when the format was created.                |
| `updatedAt` | `Timestamp`  | The timestamp when the format was last updated.           |

Column map keys:
`scene`, `category`, `feature`, `detail`, `logic`, `progress`, `result`.
Each value is either a header name or a zero-based column index (string).

### `projects`

Stores project information.

| Field         | Type                   | Description                                         |
|---------------|------------------------|-----------------------------------------------------|
| `id`          | `string`               | The project's unique ID.                            |
| `name`        | `string`               | The name of the project.                            |
| `description` | `string` (optional)    | A description of the project.                       |
| `ownerId`     | `string`               | The UID of the user who owns the project.           |
| `memberIds`   | `array` of `string`    | An array of UIDs of users who are members.          |
| `memberRoles` | `map`                  | Map of user UIDs to roles (`owner`, `admin`, `editor`, `viewer`). |
| `createdAt`   | `Timestamp` (optional) | The timestamp when the project was created.         |
| `updatedAt`   | `Timestamp` (optional) | The timestamp when the project was last updated.    |

#### Subcollections

##### `projects/{projectId}/milestones`

Stores milestone information for a project.

| Field         | Type                   | Description                                                |
|---------------|------------------------|------------------------------------------------------------|
| `id`          | `string`               | The milestone's unique ID.                                 |
| `title`       | `string`               | The title of the milestone.                                |
| `description` | `string` (optional)    | A description of the milestone.                            |
| `status`      | `string`               | The status (`Planned`, `Active`, `Complete`).              |
| `dueDate`     | `string` (optional)    | The due date of the milestone.                             |
| `createdAt`   | `Timestamp` (optional) | The timestamp when the milestone was created.              |
| `updatedAt`   | `Timestamp` (optional) | The timestamp when the milestone was last updated.         |

###### Subcollections

####### `projects/{projectId}/milestones/{milestoneId}/tasks`

Stores task information for a milestone.

| Field         | Type                   | Description                                                |
|---------------|------------------------|------------------------------------------------------------|
| `id`          | `string`               | The task's unique ID.                                      |
| `title`       | `string`               | The title of the task.                                     |
| `description` | `string`               | A description of the task.                                 |
| `status`      | `string`               | The status (`Backlog`, `In Progress`, `Review`, `Done`).   |
| `priority`    | `string`               | The priority (`Low`, `Medium`, `High`).                    |
| `completed`   | `boolean`              | Whether the task is completed.                             |
| `assigneeIds` | `array` of `string`    | An array of UIDs of users assigned to the task.            |
| `labels`      | `array` of `string`    | An array of labels for the task.                           |
| `order`       | `number` (optional)    | Manual ordering within a status column and table view.     |
| `dueDate`     | `string` (optional)    | The due date of the task.                                  |
| `createdAt`   | `Timestamp` (optional) | The timestamp when the task was created.                   |
| `updatedAt`   | `Timestamp` (optional) | The timestamp when the task was last updated.              |
| `creatorId`   | `string`               | The UID of the user who created the task.                  |

## Firebase Storage

### `profile-photos/{uid}/avatar.{ext}`

Stores user profile photos uploaded from the profile page.

| Path Component | Description                                                  |
|----------------|--------------------------------------------------------------|
| `{uid}`        | The user's unique ID from Firebase Auth.                     |
| `{ext}`        | File extension (jpg, png, gif, webp).                        |

**Constraints:**
- Maximum file size: 5MB
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Files are overwritten on re-upload (no versioning)
