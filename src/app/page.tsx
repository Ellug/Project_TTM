"use client";

import { AuthPanel } from "@/components/AuthPanel";

export default function Home() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col gap-8 animate-rise-in">
        <AuthPanel />
      </div>
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            What your team gets
          </h3>
          <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent)]" />
              Project dashboards with member-only access and milestone gates.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent-2)]" />
              Markdown-first task cards with priorities, labels, and assignees.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--success)]" />
              Realtime updates for producers, designers, and engineers.
            </li>
          </ul>
        </div>
        <div className="panel p-6">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Suggested workflows
          </h3>
          <div className="mt-4 grid gap-4 text-sm text-[var(--muted)]">
            <div>
              <p className="font-medium text-[var(--text)]">
                Sprint milestones
              </p>
              <p>
                Split production beats into milestones and keep tasks scoped to
                each sprint.
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--text)]">Feature pods</p>
              <p>
                Assign tasks to pods with clear ownership and priority signals.
              </p>
            </div>
          </div>
        </div>
        <div className="panel p-6 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--text)]">Quick start</p>
          <p className="mt-2">
            Title → Projects → Milestones. Create a project, invite teammates,
            then build out tasks inside each milestone.
          </p>
        </div>
      </div>
    </div>
  );
}
