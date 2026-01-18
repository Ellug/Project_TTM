import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

type NotificationType =
  | "project_created"
  | "project_deleted"
  | "member_invited"
  | "member_joined"
  | "member_removed"
  | "milestone_created"
  | "milestone_updated"
  | "milestone_deleted"
  | "task_created"
  | "task_updated"
  | "task_deleted";

type NotificationPayload = {
  type: NotificationType;
  userName: string;
  projectName?: string;
  milestoneName?: string;
  taskName?: string;
  details?: string;
};

const getEmoji = (type: NotificationType): string => {
  switch (type) {
    case "project_created":
      return "🎉";
    case "project_deleted":
      return "🗑️";
    case "member_invited":
    case "member_joined":
      return "👋";
    case "member_removed":
      return "👤";
    case "milestone_created":
      return "🏁";
    case "milestone_updated":
      return "📝";
    case "milestone_deleted":
      return "❌";
    case "task_created":
      return "✅";
    case "task_updated":
      return "🔄";
    case "task_deleted":
      return "🗑️";
    default:
      return "📢";
  }
};

const formatMessage = (payload: NotificationPayload): string => {
  const emoji = getEmoji(payload.type);
  const { userName, projectName, milestoneName, taskName, details } = payload;

  switch (payload.type) {
    case "project_created":
      return `${emoji} **${userName}**님이 **${projectName}** 프로젝트를 생성했습니다.`;
    case "project_deleted":
      return `${emoji} **${userName}**님이 **${projectName}** 프로젝트를 삭제했습니다.`;
    case "member_invited":
      return `${emoji} **${userName}**님이 **${projectName}** 프로젝트에 **${details}**님을 초대했습니다.`;
    case "member_joined":
      return `${emoji} **${userName}**님이 **${projectName}** 프로젝트에 합류했습니다.`;
    case "member_removed":
      return `${emoji} **${details}**님이 **${projectName}** 프로젝트에서 제외되었습니다.`;
    case "milestone_created":
      return `${emoji} **${userName}**님이 **${projectName}**에 마일스톤 **${milestoneName}**을(를) 생성했습니다.`;
    case "milestone_updated":
      return `${emoji} **${userName}**님이 **${projectName}**의 마일스톤 **${milestoneName}**을(를) 수정했습니다.${details ? ` (${details})` : ""}`;
    case "milestone_deleted":
      return `${emoji} **${userName}**님이 **${projectName}**의 마일스톤 **${milestoneName}**을(를) 삭제했습니다.`;
    case "task_created":
      return `${emoji} **${userName}**님이 **${projectName}** > **${milestoneName}**에 태스크 **${taskName}**을(를) 생성했습니다.`;
    case "task_updated":
      return `${emoji} **${userName}**님이 **${taskName}** 태스크를 수정했습니다.${details ? ` (${details})` : ""}`;
    case "task_deleted":
      return `${emoji} **${userName}**님이 **${taskName}** 태스크를 삭제했습니다.`;
    default:
      return `${emoji} ${userName}: ${details || "알림"}`;
  }
};

export async function POST(request: NextRequest) {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      console.error("Discord webhook URL is not configured.");
      return NextResponse.json(
        { error: "Discord webhook not configured" },
        { status: 500 }
      );
    }
    const payload: NotificationPayload = await request.json();

    if (!payload.type || !payload.userName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const message = formatMessage(payload);

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
        username: "TTM Bot",
        avatar_url:
          "https://cdn.discordapp.com/embed/avatars/0.png",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord webhook error:", errorText);
      return NextResponse.json(
        { error: "Failed to send Discord notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discord notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
