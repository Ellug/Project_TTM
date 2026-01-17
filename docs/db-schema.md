# Database Schema

This document outlines the schema for the Firestore database.

## Collections

### `users`

Stores user profile information.

| Field         | Type      | Description                                  |
|---------------|-----------|----------------------------------------------|
| `uid`         | `string`  | The user's unique ID from Firebase Auth.     |
| `email`       | `string`  | The user's email address.                    |
| `displayName` | `string`  | The user's display name.                     |
| `nickname`    | `string`  | The user's nickname.                         |
| `photoURL`    | `string`  | URL for the user's profile picture.          |
| `createdAt`   | `Timestamp` | The timestamp when the user was created.     |
| `updatedAt`   | `Timestamp` | The timestamp when the user was last updated.|

### `projects`

Stores project information.

| Field         | Type                 | Description                                    |
|---------------|----------------------|------------------------------------------------|
| `id`          | `string`             | The project's unique ID.                       |
| `name`        | `string`             | The name of the project.                       |
| `description` | `string` (optional)  | A description of the project.                  |
| `ownerId`     | `string`             | The UID of the user who owns the project.      |
| `memberIds`   | `array` of `string`  | An array of UIDs of users who are members.     |
| `memberRoles` | `map`                | A map of user UIDs to their roles in the project. |
| `createdAt`   | `Timestamp` (optional) | The timestamp when the project was created.    |
| `updatedAt`   | `Timestamp` (optional) | The timestamp when the project was last updated.|

#### Subcollections

##### `milestones`

Stores milestone information for a project.

| Field         | Type                | Description                                       |
|---------------|---------------------|---------------------------------------------------|
| `id`          | `string`            | The milestone's unique ID.                        |
| `title`       | `string`            | The title of the milestone.                       |
| `description` | `string` (optional) | A description of the milestone.                   |
| `status`      | `string`            | The status of the milestone (`Planned`, `Active`, `Complete`). |
| `dueDate`     | `string` (optional) | The due date of the milestone.                    |
| `createdAt`   | `Timestamp` (optional) | The timestamp when the milestone was created.     |
| `updatedAt`   | `Timestamp` (optional) | The timestamp when the milestone was last updated.|

###### Subcollections

####### `tasks`

Stores task information for a milestone.

| Field         | Type                  | Description                                                |
|---------------|-----------------------|------------------------------------------------------------|
| `id`          | `string`              | The task's unique ID.                                      |
| `title`       | `string`              | The title of the task.                                     |
| `description` | `string`              | A description of the task.                                 |
| `status`      | `string`              | The status of the task (`Backlog`, `In Progress`, `Review`, `Done`). |
| `priority`    | `string`              | The priority of the task (`Low`, `Medium`, `High`).        |
| `completed`   | `boolean`             | Whether the task is completed.                             |
| `assigneeIds` | `array` of `string`   | An array of UIDs of users assigned to the task.            |
| `labels`      | `array` of `string`   | An array of labels for the task.                           |
| `order`       | `number` (optional)   | Manual ordering within a status column.                    |
| `dueDate`     | `string` (optional)   | The due date of the task.                                  |
| `createdAt`   | `Timestamp` (optional) | The timestamp when the task was created.                   |
| `updatedAt`   | `Timestamp` (optional) | The timestamp when the task was last updated.              |
| `creatorId`   | `string`              | The UID of the user who created the task.                  |
