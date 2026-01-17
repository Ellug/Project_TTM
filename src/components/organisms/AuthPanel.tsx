"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/atoms/Button";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { Card } from "@/components/atoms/Card";
import { FormField } from "@/components/molecules/FormField";

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
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setError("Firebase is not configured yet.");
      return;
    }
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        const { user } = result;
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          nickname: user.displayName || "New User",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      router.push("/projects");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed.";
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
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
      {!isConfigured ? (
        <Panel className="p-6">
          <p className="text-sm text-[var(--muted)]">
            Firebase is not configured. Add your credentials to
            <span className="ml-1 font-mono text-[var(--text)]">
              .env.local
            </span>{" "}
            to enable authentication.
          </p>
        </Panel>
      ) : (
        <form onSubmit={handleSubmit} className="shadow-[var(--shadow)]">
          <Card className="p-6">
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
                  <FormField label="Nickname">
                    <InputField
                      type="text"
                      value={formState.nickname}
                      onChange={(event) =>
                        handleChange("nickname", event.target.value)
                      }
                      placeholder="Studio handle"
                    />
                  </FormField>
                  <FormField label="Profile photo URL (optional)">
                    <InputField
                      type="url"
                      value={formState.photoURL}
                      onChange={(event) =>
                        handleChange("photoURL", event.target.value)
                      }
                      placeholder="https://"
                    />
                  </FormField>
                </>
              )}
              <FormField label="Email">
                <InputField
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    handleChange("email", event.target.value)
                  }
                  placeholder="team@studio.com"
                />
              </FormField>
              <FormField label="Password">
                <InputField
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  placeholder="********"
                />
              </FormField>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-[rgba(255,122,122,0.4)] bg-[rgba(255,122,122,0.1)] px-3 py-2 text-xs text-[var(--danger)]">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || googleLoading}
              >
                {loading
                  ? "Working..."
                  : mode === "login"
                  ? "Enter workspace"
                  : "Create workspace"}
              </Button>
              <div className="relative flex items-center justify-center">
                <span className="absolute w-full border-t border-[var(--border)]" />
                <span className="relative bg-[var(--surface-2)] px-2 text-xs text-[var(--muted)]">
                  OR
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? "Redirecting..." : "Sign in with Google"}
              </Button>
              {user && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push("/projects")}
                >
                  Continue to projects
                </Button>
              )}
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};
