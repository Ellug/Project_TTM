"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { AuthGate } from "@/components/AuthGate";
import { TaskCard } from "@/components/TaskCard";
import { TaskDetailsPanel } from "@/components/TaskDetailsPanel";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import type { Milestone, Project, Task, UserProfile } from "@/lib/types";
import { toDateString } from "@/lib/utils";

export default function MilestoneTasksPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const milestoneId = Array.isArray(params.milestoneId)
    ? params.milestoneId[0]
    : params.milestoneId;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");

  useEffect(() => {
    if (!projectId || !milestoneId) return;
    const projectRef = doc(db, "projects", projectId);
    const milestoneRef = doc(
      db,
      "projects",
      projectId,
      "milestones",
      milestoneId
    );

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

    const unsubMilestone = onSnapshot(milestoneRef, (snapshot) => {
      if (snapshot.exists()) {
        setMilestone({
          id: snapshot.id,
          ...(snapshot.data() as Omit<Milestone, "id">),
        });
      } else {
        setMilestone(null);
      }
    });

    const tasksRef = collection(
      db,
      "projects",
      projectId,
      "milestones",
      milestoneId,
      "tasks"
    );
    const tasksQuery = query(tasksRef, orderBy("createdAt", "desc"));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Task, "id">),
      }));
      setTasks(items);
    });

    return () => {
      unsubProject();
      unsubMilestone();
      unsubTasks();
    };
  }, [projectId, milestoneId]);

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

  const handleCreate = async () => {
    if (!projectId || !milestoneId || !user || !title.trim()) return;
    setSaving(true);
    try {
      const docRef = await addDoc(
        collection(
          db,
          "projects",
          projectId,
          "milestones",
          milestoneId,
          "tasks"
        ),
        {
          title: title.trim(),
          description: "",
          status: "Backlog",
          priority,
          completed: false,
          assigneeIds: [],
          labels: [],
          dueDate: dueDate || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          creatorId: user.uid,
        }
      );
      if (project?.ownerId === user.uid) {
        await updateDoc(doc(db, "projects", projectId), {
          updatedAt: serverTimestamp(),
        });
      }
      setSelectedTaskId(docRef.id);
      setTitle("");
      setPriority("Medium");
      setDueDate("");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!projectId || !milestoneId) return;
    await updateDoc(
      doc(
        db,
        "projects",
        projectId,
        "milestones",
        milestoneId,
        "tasks",
        taskId
      ),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      }
    );
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  useEffect(() => {
    if (!selectedTaskId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedTaskId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTaskId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = [task.title, task.description]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;
      const matchesAssignee =
        assigneeFilter === "All" ||
        task.assigneeIds.includes(assigneeFilter);
      return (
        matchesSearch && matchesStatus && matchesPriority && matchesAssignee
      );
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter]);

  const tasksByStatus = useMemo(
    () =>
      taskStatuses.reduce<Record<string, Task[]>>((acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status);
        return acc;
      }, {}),
    [filteredTasks]
  );

  const isPanelOpen = Boolean(selectedTask);

  return (
    <AuthGate>
      <div className={clsx("task-layout", isPanelOpen && "task-layout-open")}>
        <TaskDetailsPanel
          task={selectedTask}
          members={members}
          onUpdate={handleUpdateTask}
          onClose={() => setSelectedTaskId(null)}
        />
        {isPanelOpen && (
          <button
            type="button"
            className="task-overlay"
            aria-label="Close task details"
            onClick={() => setSelectedTaskId(null)}
          />
        )}
        <div className="task-content grid gap-8">
          <section className="card p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  Milestone
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                  {milestone?.title || "Milestone tasks"}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {milestone?.description ||
                    "Organize tasks for this delivery window."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                  <span>Due {toDateString(milestone?.dueDate)}</span>
                  <span className="chip">{milestone?.status || "Active"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/projects/${projectId}/milestones`}
                  className="btn-secondary text-xs sm:text-sm"
                >
                  Back to milestones
                </Link>
                <Link
                  href="/projects"
                  className="btn-ghost text-xs sm:text-sm"
                >
                  Projects
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text)]">
                Create task
              </h3>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  Title
                  <input
                    className="input-field"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Implement combat loop, UI polish, bugfix..."
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-[var(--muted)]">
                    Priority
                    <select
                      className="input-field"
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value as Task["priority"])
                      }
                    >
                      {taskPriorities.map((item) => (
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
                  disabled={!title.trim() || saving}
                >
                  {saving ? "Creating..." : "Add task"}
                </button>
              </div>
            </div>

            <div className="panel p-6">
              <h3 className="text-lg font-semibold text-[var(--text)]">
                Filters
              </h3>
              <div className="mt-4 grid gap-4 text-sm text-[var(--muted)]">
                <label className="grid gap-2">
                  Search
                  <input
                    className="input-field"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Find tasks"
                  />
                </label>
                <label className="grid gap-2">
                  Status
                  <select
                    className="input-field"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="All">All</option>
                    {taskStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  Priority
                  <select
                    className="input-field"
                    value={priorityFilter}
                    onChange={(event) => setPriorityFilter(event.target.value)}
                  >
                    <option value="All">All</option>
                    {taskPriorities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  Assignee
                  <select
                    className="input-field"
                    value={assigneeFilter}
                    onChange={(event) => setAssigneeFilter(event.target.value)}
                  >
                    <option value="All">All</option>
                    {members.map((member) => (
                      <option key={member.uid} value={member.uid}>
                        {member.nickname || member.displayName || "User"}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn-ghost text-xs uppercase tracking-[0.2em]"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                    setPriorityFilter("All");
                    setAssigneeFilter("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
              <span>{filteredTasks.length} tasks matched</span>
              {selectedTask ? (
                <span className="chip">Editing: {selectedTask.title}</span>
              ) : (
                <span>Click a task to open details.</span>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {taskStatuses.map((status, index) => (
                <div
                  key={status}
                  className="min-w-[280px] flex-1 animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text)]">
                      {status}
                    </h3>
                    <span className="chip">
                      {tasksByStatus[status]?.length || 0}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {tasksByStatus[status]?.length ? (
                      tasksByStatus[status].map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          members={members}
                          onUpdate={handleUpdateTask}
                          onSelect={handleSelectTask}
                          isSelected={selectedTaskId === task.id}
                        />
                      ))
                    ) : (
                      <div className="panel p-4 text-xs text-[var(--muted)]">
                        No tasks here yet. Create one above.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AuthGate>
  );
}
