"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import type { Project } from "@/lib/types";
import { toDateString } from "@/lib/utils";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const projectsRef = collection(db, "projects");
    const projectsQuery = query(
      projectsRef,
      where("memberIds", "array-contains", user.uid)
    );
    const unsub = onSnapshot(projectsQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Project, "id">),
      }));
      const sorted = items.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime;
      });
      setProjects(sorted);
    });

    return () => unsub();
  }, [user]);

  const canCreate = useMemo(() => Boolean(name.trim()), [name]);

  const handleCreate = async () => {
    if (!user || !canCreate) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "projects"), {
        name: name.trim(),
        description: description.trim(),
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setName("");
      setDescription("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGate>
      <div className="grid gap-8">
        <section className="card p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text)]">
                Projects
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Create a project space and invite collaborators.
              </p>
            </div>
            <div className="chip">Member-only access</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_1.8fr_auto] md:items-end">
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Project name
              <input
                className="input-field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="New release, core systems, live ops..."
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Description (optional)
              <input
                className="input-field"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Define scope, goals, and context."
              />
            </label>
            <button
              className="btn-primary w-full md:w-auto"
              onClick={handleCreate}
              disabled={!canCreate || saving}
            >
              {saving ? "Creating..." : "Create project"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {projects.length === 0 ? (
            <div className="panel p-6 text-sm text-[var(--muted)]">
              No projects yet. Create your first workspace above.
            </div>
          ) : (
            projects.map((project, index) => (
              <div
                key={project.id}
                className="card flex flex-col gap-4 p-6 animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text)]">
                      {project.name}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {project.description || "No description yet."}
                    </p>
                  </div>
                  <span className="chip">
                    {project.memberIds?.length || 1} members
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
                  <span>Updated {toDateString(project.updatedAt)}</span>
                  <Link
                    className="btn-secondary"
                    href={`/projects/${project.id}/milestones`}
                  >
                    View milestones
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
