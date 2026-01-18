"use client";

import { AuthGate } from "@/components/organisms/AuthGate";
import ProfileEditForm from "@/components/organisms/ProfileEditForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { toDateString } from "@/lib/utils";

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const displayName =
    profile?.nickname || profile?.displayName || user?.displayName || "User";
  const email = profile?.email || user?.email || "No email on file";
  const userId = profile?.uid || user?.uid || "-";
  const joinedAt = profile?.createdAt
    ? toDateString(profile.createdAt)
    : "-";
  const syncedAt = profile?.updatedAt
    ? toDateString(profile.updatedAt)
    : "-";

  return (
    <AuthGate>
      <div className="grid gap-8">
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-[var(--text)]">
              Profile
            </h1>
            <Chip>TTM Identity</Chip>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Shape how teammates see you in Team Task Manage and keep your
            workspace profile polished.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="relative overflow-hidden p-6 animate-rise-in">
            <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[var(--accent-glow)] blur-3xl" />
            <div className="relative grid gap-5">
              <div className="flex items-center gap-4">
                <Avatar
                  name={displayName}
                  src={profile?.photoURL}
                  size="lg"
                />
                <div>
                  <p className="text-lg font-semibold text-[var(--text)]">
                    {displayName}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{email}</p>
                </div>
              </div>

              <div className="grid gap-3 text-xs text-[var(--muted)]">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <span>TTM ID</span>
                  <span className="break-all font-mono text-[var(--text)]">
                    {userId}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <span>Member since</span>
                  <span className="text-[var(--text)]">{joinedAt}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <span>Last synced</span>
                  <span className="text-[var(--text)]">{syncedAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Chip>Google avatar sync</Chip>
                <Chip>Visible to collaborators</Chip>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-rise-in">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Edit profile
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Update your nickname and keep your account details current.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <ProfileEditForm />
            </div>
          </Card>
        </section>
      </div>
    </AuthGate>
  );
}
