"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { AuthGate } from "@/components/AuthGate";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { milestoneStatuses } from "@/lib/constants";
import type { Milestone, Project, UserProfile } from "@/lib/types";
import { toDateString } from "@/lib/utils";

export default function MilestonesPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Milestone["status"]>("Planned");
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, "projects", projectId);
    const unsubProject = onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        setProject({
          id: snapshot.id,
          ...(snapshot.data() as Omit<Project, "id">),
        });
      } else {
        setProject(null);
      }
    });

    const milestonesRef = collection(db, "projects", projectId, "milestones");
    const milestonesQuery = query(milestonesRef, orderBy("createdAt", "desc"));
    const unsubMilestones = onSnapshot(milestonesQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Milestone, "id">),
      }));
      setMilestones(items);
    });

    return () => {
      unsubProject();
      unsubMilestones();
    };
  }, [projectId]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!project?.memberIds?.length) {
        setMembers([]);
        return;
      }
      const snapshots = await Promise.all(
        project.memberIds.map((uid) => getDoc(doc(db, "users", uid)))
      );
      const results: UserProfile[] = snapshots
        .filter((snapshot) => snapshot.exists())
        .map((snapshot) => snapshot.data() as UserProfile);
      setMembers(results);
    };

    loadMembers().catch(() => {
      setMembers([]);
    });
  }, [project?.memberIds]);

  const canCreate = useMemo(() => Boolean(title.trim()), [title]);

  const handleCreate = async () => {
    if (!projectId || !user || !canCreate) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "projects", projectId, "milestones"), {
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate: dueDate || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (project?.ownerId === user.uid) {
        await updateDoc(doc(db, "projects", projectId), {
          updatedAt: serverTimestamp(),
        });
      }
      setTitle("");
      setDescription("");
      setDueDate("");
      setStatus("Planned");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!projectId || !inviteEmail.trim() || !project) return;
    setInviteMessage("");
    try {
      const usersRef = collection(db, "users");
      const userQuery = query(
        usersRef,
        where("email", "==", inviteEmail.trim())
      );
      const snapshot = await getDocs(userQuery);
      if (snapshot.empty) {
        setInviteMessage("No user found with that email.");
        return;
      }
      const invitee = snapshot.docs[0].data() as UserProfile;
      await updateDoc(doc(db, "projects", projectId), {
        memberIds: arrayUnion(invitee.uid),
        updatedAt: serverTimestamp(),
      });
      setInviteMessage(`Invited ${invitee.nickname || invitee.email}.`);
      setInviteEmail("");
    } catch (error) {
      setInviteMessage(
        error instanceof Error ? error.message : "Invite failed."
      );
    }
  };

  const isOwner = user?.uid === project?.ownerId;

  return (
    <AuthGate>
      <div className="grid gap-8">
        <section className="card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Project
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {project?.name || "Project workspace"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {project?.description || "Define milestones and deliverables."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="chip">
                {project?.memberIds?.length || 0} members
              </div>
              <Link
                href="/projects"
                className="btn-secondary text-xs sm:text-sm"
              >
                Back to projects
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Create milestone
            </h3>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--muted)]">
                Title
                <input
                  className="input-field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Vertical slice, alpha, content lock..."
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--muted)]">
                Description
                <input
                  className="input-field"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Scope, deliverables, or exit criteria."
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  Status
                  <select
                    className="input-field"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as Milestone["status"])
                    }
                  >
                    {milestoneStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  Due date
                  <input
                    className="input-field"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={handleCreate}
                disabled={!canCreate || saving}
              >
                {saving ? "Creating..." : "Add milestone"}
              </button>
            </div>
          </div>

          <div className="panel p-6">
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
                    <span className="chip">
                      {member.uid === project?.ownerId ? "Owner" : "Member"}
                    </span>
                  </div>
                ))
              )}
            </div>
            {isOwner && (
              <div className="mt-5 grid gap-3">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  Invite by email
                  <input
                    className="input-field"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="collaborator@studio.com"
                  />
                </label>
                <button
                  className="btn-secondary"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                >
                  Add member
                </button>
                {inviteMessage && (
                  <p className="text-xs text-[var(--muted)]">
                    {inviteMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {milestones.length === 0 ? (
            <div className="panel p-6 text-sm text-[var(--muted)]">
              No milestones yet. Add the first milestone above.
            </div>
          ) : (
            milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="card flex flex-col gap-4 p-6 animate-fade-in"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-semibold text-[var(--text)]">
                      {milestone.title}
                    </h3>
                    <span className="chip">{milestone.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {milestone.description || "No description yet."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
                  <span>Due {toDateString(milestone.dueDate)}</span>
                  <Link
                    href={`/projects/${projectId}/milestones/${milestone.id}`}
                    className="btn-secondary"
                  >
                    Open tasks
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </AuthGate>
  );
}
