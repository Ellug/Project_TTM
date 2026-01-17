"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/atoms/Avatar";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, signOutUser } = useAuth();
  const showNav = pathname !== "/";
  const isMilestoneTasks =
    pathname.includes("/milestones/") && !pathname.endsWith("/milestones");
  const containerClass = isMilestoneTasks ? "max-w-none" : "max-w-6xl";

  return (
    <div className="relative min-h-screen">
      {showNav && (
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(8,10,15,0.85)] backdrop-blur">
          <div
            className={`mx-auto flex w-full items-center justify-between px-6 py-4 ${containerClass}`}
          >
            <div className="flex items-center gap-4">
              <Link
                href="/projects"
                className="text-lg font-semibold tracking-tight text-[var(--text)]"
              >
                TTM
              </Link>
              <div className="hidden items-center gap-2 text-sm text-[var(--muted)] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Team Task Manage
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/projects"
                className="rounded-full border border-transparent px-3 py-1 text-[var(--muted)] transition hover:border-[var(--border)] hover:text-[var(--text)]"
              >
                Projects
              </Link>
              {user ? (
                <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <Avatar
                      name={profile?.nickname || profile?.displayName || "User"}
                      src={profile?.photoURL}
                      size="sm"
                    />
                    <div className="hidden text-left sm:block">
                      <p className="text-xs text-[var(--muted)]">Signed in</p>
                      <p className="text-sm font-medium text-[var(--text)]">
                        {profile?.nickname || profile?.displayName || "User"}
                      </p>
                    </div>
                  </Link>
                  <button
                    className="ml-2 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--text)]"
                    onClick={async () => {
                      await signOutUser();
                      router.push("/");
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/"
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  Back to Title
                </Link>
              )}
            </div>
          </div>
        </header>
      )}
      <main
        className={`relative mx-auto w-full px-6 pb-20 pt-10 ${containerClass}`}
      >
        {children}
      </main>
    </div>
  );
};
