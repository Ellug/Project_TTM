"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/atoms/Button";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { FormField } from "@/components/molecules/FormField";
import { Avatar } from "@/components/atoms/Avatar";
import { UserService } from "@/lib/services/UserService";

type ProfileForm = {
  nickname: string;
};

export default function ProfileEditForm() {
  const { profile, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
  } = useForm<ProfileForm>({
    defaultValues: {
      nickname: profile?.nickname || profile?.displayName || "",
    },
    // Re-initialize form when profile data is loaded
    values: profile ? {
      nickname: profile.nickname || profile.displayName || "",
    } : undefined,
  });

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadProgress(0);
    setUploadError(null);
    setSubmitStatus(null);

    try {
      const photoURL = await UserService.uploadProfilePhoto(
        user.uid,
        file,
        (progress) => setUploadProgress(progress)
      );

      // Update profile immediately with new photoURL
      await UserService.updateProfile(user.uid, {
        nickname: profile?.nickname || profile?.displayName || "",
        photoURL,
      });

      setSubmitStatus({
        type: "success",
        message: "Profile photo updated successfully.",
      });
    } catch (error) {
      console.error(error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadProgress(null);
      // Reset file input
      event.target.value = "";
    }
  };

  const handlePhotoDelete = async () => {
    if (!user || !profile?.photoURL) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await UserService.deleteProfilePhoto(user.uid);
      setSubmitStatus({
        type: "success",
        message: "Profile photo removed.",
      });
    } catch (error) {
      console.error(error);
      setSubmitStatus({
        type: "error",
        message: "Failed to remove photo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      await UserService.updateProfile(user.uid, {
        nickname: data.nickname,
        photoURL: profile?.photoURL,
      });
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
          Upload a custom photo or keep your Google avatar. Nickname appears
          across TTM.
        </p>
      </Panel>

      <div className="grid gap-3">
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Profile Photo
        </label>

        <div className="flex items-start gap-4">
          <Avatar
            name={profile.nickname || profile.displayName}
            src={profile.photoURL}
            size="lg"
          />

          <div className="flex-1 grid gap-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadProgress !== null}
                />
                <span className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-all hover:bg-[var(--surface-2)] disabled:opacity-50">
                  {uploadProgress !== null ? "Uploading..." : "Upload photo"}
                </span>
              </label>

              {profile.photoURL && (
                <Button
                  type="button"
                  onClick={handlePhotoDelete}
                  disabled={isSubmitting || uploadProgress !== null}
                  className="text-sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <p className="text-xs text-[var(--muted)]">
              JPEG, PNG, GIF, or WEBP. Max 5MB.
            </p>

            {uploadProgress !== null && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">Uploading...</span>
                  <span className="font-medium text-[var(--text)]">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-[var(--danger)]">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <FormField
          label="Nickname"
          labelClassName="text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
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
