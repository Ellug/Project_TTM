"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

type Mode = "login" | "signup";

export const AuthPanel = () => {
  const router = useRouter();
  const { user, isConfigured } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    nickname: "",
    photoURL: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!isConfigured) {
      setError("Firebase is not configured yet.");
      return;
    }

    if (!formState.email || !formState.password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && !formState.nickname) {
      setError("Nickname is required for sign up.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          formState.email,
          formState.password
        );
        await updateProfile(credential.user, {
          displayName: formState.nickname,
          photoURL: formState.photoURL || undefined,
        });

        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          email: formState.email,
          displayName: formState.nickname,
          nickname: formState.nickname,
          photoURL: formState.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(
          auth,
          formState.email,
          formState.password
        );
      }
      router.push("/projects");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          ForgeFlow
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--text)] sm:text-4xl">
          Ship faster, stay aligned.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-[var(--muted)] sm:text-base">
          A dark-mode task cockpit for game development teams. Plan projects,
          track milestones, and ship builds with clarity.
        </p>
      </div>

      {!isConfigured ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm text-[var(--muted)]">
            Firebase is not configured. Add your credentials to
            <span className="ml-1 font-mono text-[var(--text)]">
              .env.local
            </span>{" "}
            to enable authentication.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <button
              type="button"
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--text)]"
              onClick={() => {
                setError("");
                setMode((prev) => (prev === "login" ? "signup" : "login"));
              }}
            >
              {mode === "login" ? "Need an account?" : "Have an account?"}
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            {mode === "signup" && (
              <>
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  Nickname
                  <input
                    className="input-field"
                    type="text"
                    value={formState.nickname}
                    onChange={(event) =>
                      handleChange("nickname", event.target.value)
                    }
                    placeholder="Studio handle"
                  />
                </label>
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  Profile photo URL (optional)
                  <input
                    className="input-field"
                    type="url"
                    value={formState.photoURL}
                    onChange={(event) =>
                      handleChange("photoURL", event.target.value)
                    }
                    placeholder="https://"
                  />
                </label>
              </>
            )}
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Email
              <input
                className="input-field"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  handleChange("email", event.target.value)
                }
                placeholder="team@studio.com"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              Password
              <input
                className="input-field"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  handleChange("password", event.target.value)
                }
                placeholder="********"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-[rgba(255,122,122,0.4)] bg-[rgba(255,122,122,0.1)] px-3 py-2 text-xs text-[var(--danger)]">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading
                ? "Working..."
                : mode === "login"
                  ? "Enter workspace"
                  : "Create workspace"}
            </button>
            {user && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => router.push("/projects")}
              >
                Continue to projects
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
