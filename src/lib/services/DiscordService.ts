"use client";

type NotificationType =
  | "project_created"
  | "project_deleted"
  | "member_invited"
  | "member_joined"
  | "member_removed"
  | "milestone_created"
  | "milestone_updated"
  | "milestone_deleted"
  | "board_post_created"
  | "board_post_updated"
  | "board_post_deleted"
  | "task_created"
  | "task_updated"
  | "task_deleted";

type NotificationPayload = {
  type: NotificationType;
  userName: string;
  projectName?: string;
  milestoneName?: string;
  taskName?: string;
  postTitle?: string;
  details?: string;
};

export class DiscordService {
  private static async notify(payload: NotificationPayload): Promise<void> {
    try {
      await fetch("/api/discord-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Silent fail - don't block main operations
      console.error("Discord notification failed:", error);
    }
  }

  // Project notifications
  static notifyProjectCreated(userName: string, projectName: string) {
    return this.notify({
      type: "project_created",
      userName,
      projectName,
    });
  }

  static notifyProjectDeleted(userName: string, projectName: string) {
    return this.notify({
      type: "project_deleted",
      userName,
      projectName,
    });
  }

  // Member notifications
  static notifyMemberInvited(
    userName: string,
    projectName: string,
    invitedUserName: string
  ) {
    return this.notify({
      type: "member_invited",
      userName,
      projectName,
      details: invitedUserName,
    });
  }

  static notifyMemberJoined(userName: string, projectName: string) {
    return this.notify({
      type: "member_joined",
      userName,
      projectName,
    });
  }

  static notifyMemberRemoved(
    projectName: string,
    removedUserName: string
  ) {
    return this.notify({
      type: "member_removed",
      userName: "System",
      projectName,
      details: removedUserName,
    });
  }

  // Milestone notifications
  static notifyMilestoneCreated(
    userName: string,
    projectName: string,
    milestoneName: string
  ) {
    return this.notify({
      type: "milestone_created",
      userName,
      projectName,
      milestoneName,
    });
  }

  static notifyMilestoneUpdated(
    userName: string,
    projectName: string,
    milestoneName: string,
    details?: string
  ) {
    return this.notify({
      type: "milestone_updated",
      userName,
      projectName,
      milestoneName,
      details,
    });
  }

  static notifyMilestoneDeleted(
    userName: string,
    projectName: string,
    milestoneName: string
  ) {
    return this.notify({
      type: "milestone_deleted",
      userName,
      projectName,
      milestoneName,
    });
  }

  // Board post notifications
  static notifyBoardPostCreated(
    userName: string,
    projectName: string,
    postTitle: string
  ) {
    return this.notify({
      type: "board_post_created",
      userName,
      projectName,
      postTitle,
    });
  }

  static notifyBoardPostUpdated(
    userName: string,
    projectName: string,
    postTitle: string,
    details?: string
  ) {
    return this.notify({
      type: "board_post_updated",
      userName,
      projectName,
      postTitle,
      details,
    });
  }

  static notifyBoardPostDeleted(
    userName: string,
    projectName: string,
    postTitle: string
  ) {
    return this.notify({
      type: "board_post_deleted",
      userName,
      projectName,
      postTitle,
    });
  }

  // Task notifications
  static notifyTaskCreated(
    userName: string,
    projectName: string,
    milestoneName: string,
    taskName: string
  ) {
    return this.notify({
      type: "task_created",
      userName,
      projectName,
      milestoneName,
      taskName,
    });
  }

  static notifyTaskUpdated(
    userName: string,
    taskName: string,
    details?: string
  ) {
    return this.notify({
      type: "task_updated",
      userName,
      taskName,
      details,
    });
  }

  static notifyTaskDeleted(userName: string, taskName: string) {
    return this.notify({
      type: "task_deleted",
      userName,
      taskName,
    });
  }
}
