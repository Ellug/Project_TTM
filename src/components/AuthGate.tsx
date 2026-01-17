"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (!isConfigured) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        Firebase is not configured. Add your credentials to
        <span className="ml-1 font-mono text-[var(--text)]">.env.local</span>{" "}
        to continue.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        Loading workspace...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        Redirecting to title screen...
      </div>
    );
  }

  return <>{children}</>;
};
