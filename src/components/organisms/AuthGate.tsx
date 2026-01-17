"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Panel } from "@/components/atoms/Panel";

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
      <Panel className="p-6 text-sm text-[var(--muted)]">
        Firebase is not configured. Add your credentials to
        <span className="ml-1 font-mono text-[var(--text)]">.env.local</span>{" "}
        to continue.
      </Panel>
    );
  }

  if (loading) {
    return (
      <Panel className="p-6 text-sm text-[var(--muted)]">
        Loading workspace...
      </Panel>
    );
  }

  if (!user) {
    return (
      <Panel className="p-6 text-sm text-[var(--muted)]">
        Redirecting to title screen...
      </Panel>
    );
  }

  return <>{children}</>;
};
