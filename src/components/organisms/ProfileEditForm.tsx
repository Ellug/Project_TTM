"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/atoms/Button";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { FormField } from "@/components/molecules/FormField";
import { UserService } from "@/lib/services/UserService";

type ProfileForm = {
  nickname: string;
  photoURL: string;
};

export default function ProfileEditForm() {
  const { profile, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      nickname: profile?.nickname || profile?.displayName || "",
      photoURL: profile?.photoURL || "",
    },
    // Re-initialize form when profile data is loaded
    values: profile ? {
      nickname: profile.nickname || profile.displayName || "",
      photoURL: profile.photoURL || "",
    } : undefined,
  });

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      await UserService.updateProfile(user.uid, data);
      setSubmitStatus({
        type: "success",
        message: "Profile updated. Changes are now visible to teammates.",
      });
    } catch (error) {
      console.error(error);
      setSubmitStatus({
        type: "error",
        message: "Profile update failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <Panel className="p-4 text-sm text-[var(--muted)]">
        Loading profile settings...
      </Panel>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <Panel className="grid gap-1 p-4 text-sm">
        <p className="text-sm font-semibold text-[var(--text)]">
          Profile identity
        </p>
        <p className="text-xs text-[var(--muted)]">
          Nickname appears across TTM. Profile photos stay synced with your
          Google account.
        </p>
      </Panel>

      <div className="grid gap-4">
        <FormField
          label="Nickname"
          labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
          error={errors.nickname}
        >
          <InputField
            {...register("nickname", { required: "Nickname is required." })}
            placeholder="Studio handle"
          />
        </FormField>
        <FormField
          label="Email"
          labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
        >
          <InputField
            value={profile.email}
            disabled
            readOnly
            className="opacity-70"
          />
        </FormField>
      </div>

      {submitStatus && (
        <p
          className={`rounded-lg border px-3 py-2 text-xs ${
            submitStatus.type === "success"
              ? "border-[rgba(57,217,138,0.4)] bg-[rgba(57,217,138,0.12)] text-[var(--success)]"
              : "border-[rgba(255,122,122,0.4)] bg-[rgba(255,122,122,0.12)] text-[var(--danger)]"
          }`}
        >
          {submitStatus.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          Updates sync instantly across tasks and member lists.
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update profile"}
        </Button>
      </div>
    </form>
  );
}
