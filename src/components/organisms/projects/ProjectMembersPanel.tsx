"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemberRole, Project, UserProfile } from "@/lib/types";
import { memberRoles } from "@/lib/constants";
import { ProjectService } from "@/lib/services/ProjectService";
import { UserService } from "@/lib/services/UserService";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";

type ProjectMembersPanelProps = {
  projectId: string;
  project: Project | null;
  members: UserProfile[];
  isOwner: boolean;
};

export const ProjectMembersPanel = ({
  projectId,
  project,
  members,
  isOwner,
}: ProjectMembersPanelProps) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isInviteFocused, setIsInviteFocused] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const assignableRoles = memberRoles.filter((role) => role !== "owner");

  useEffect(() => {
    if (!isOwner) return;
    const unsubscribe = UserService.subscribeAllUsers(setAllUsers);
    return () => unsubscribe();
  }, [isOwner]);

  const inviteSuggestions = useMemo(() => {
    const query = inviteEmail.trim().toLowerCase();
    if (!query) return [];
    const memberIds = new Set(project?.memberIds ?? []);
    const matches = allUsers
      .filter((member) => !memberIds.has(member.uid))
      .filter((member) => {
        const nickname = member.nickname ?? "";
        const displayName = member.displayName ?? "";
        const email = member.email ?? "";
        if (!email) return false;
        const haystack = `${nickname} ${displayName} ${email}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 30);
    const unique = new Map<string, UserProfile>();
    matches.forEach((member) => {
      const key = `${(member.nickname ?? "").toLowerCase()}|${(
        member.email ?? ""
      ).toLowerCase()}`;
      if (!unique.has(key)) {
        unique.set(key, member);
      }
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [allUsers, inviteEmail, project?.memberIds]);

  const resolveMemberRole = (memberId: string): MemberRole => {
    if (memberId === project?.ownerId) return "owner";
    return project?.memberRoles?.[memberId] ?? "editor";
  };

  const formatRole = (role: MemberRole) =>
    `${role[0].toUpperCase()}${role.slice(1)}`;

  const handleInvite = async () => {
    if (!projectId || !inviteEmail.trim() || !project || !isOwner) return;
    setInviteMessage("");
    setInviting(true);
    try {
      const invitee = await ProjectService.inviteMemberByEmail(
        projectId,
        inviteEmail.trim()
      );
      if (!invitee) {
        setInviteMessage("No user found with that email.");
        return;
      }
      setInviteMessage(`Invited ${invitee.nickname || invitee.email}.`);
      setInviteEmail("");
    } catch (error) {
      setInviteMessage(
        error instanceof Error ? error.message : "Invite failed."
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    nextRole: MemberRole
  ) => {
    if (!projectId || !project || !isOwner) return;
    if (memberId === project.ownerId) return;
    const current = project.memberRoles?.[memberId] ?? "editor";
    if (current === nextRole) return;
    await ProjectService.updateMemberRole(projectId, memberId, nextRole);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!projectId || !project || !isOwner) return;
    if (memberId === project.ownerId || removingMemberId) return;
    const member = members.find((item) => item.uid === memberId);
    const memberName =
      member?.nickname || member?.displayName || member?.email || "this member";
    const confirmed = window.confirm(`Remove ${memberName} from this project?`);
    if (!confirmed) return;
    setRemovingMemberId(memberId);
    try {
      await ProjectService.removeMember(projectId, memberId);
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <Panel className="p-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">
        Project members
      </h3>
      <div className="mt-4 grid gap-3">
        {members.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No member profiles loaded yet.
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.uid}
              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={member.nickname || member.displayName || "User"}
                  src={member.photoURL}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {member.nickname || member.displayName || "User"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {member.email}
                  </p>
                </div>
              </div>
              {isOwner && member.uid !== project?.ownerId ? (
                <div className="flex items-center gap-2">
                  <div className="w-[160px]">
                    <SelectField
                      className="text-xs uppercase tracking-[0.2em]"
                      value={resolveMemberRole(member.uid)}
                      onChange={(event) =>
                        handleRoleChange(
                          member.uid,
                          event.target.value as MemberRole
                        )
                      }
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {formatRole(role)}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-[11px] uppercase tracking-[0.2em] text-[var(--danger)]"
                    onClick={() => handleRemoveMember(member.uid)}
                    disabled={removingMemberId === member.uid}
                  >
                    {removingMemberId === member.uid ? "Removing..." : "Remove"}
                  </Button>
                </div>
              ) : (
                <Chip>{formatRole(resolveMemberRole(member.uid))}</Chip>
              )}
            </div>
          ))
        )}
      </div>
      {isOwner && (
        <div className="mt-5 grid gap-3">
          <FormField label="Invite by email">
            <div className="relative">
              <InputField
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                onFocus={() => setIsInviteFocused(true)}
                onBlur={() => setIsInviteFocused(false)}
                placeholder="collaborator@studio.com"
              />
              {isInviteFocused && inviteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] shadow-[var(--shadow)]">
                  {inviteSuggestions.map((member) => (
                    <button
                      key={member.uid}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--surface-hover)]"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setInviteEmail(member.email);
                        setInviteMessage("");
                      }}
                    >
                      <Avatar
                        name={member.nickname || member.displayName || "User"}
                        src={member.photoURL}
                        size="sm"
                      />
                      <span className="grid">
                        <span className="font-medium">
                          {member.nickname || member.displayName || "User"}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {member.email}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormField>
          <Button
            variant="secondary"
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || inviting}
          >
            {inviting ? "Inviting..." : "Add member"}
          </Button>
          {inviteMessage && (
            <p className="text-xs text-[var(--muted)]">{inviteMessage}</p>
          )}
        </div>
      )}
    </Panel>
  );
};
