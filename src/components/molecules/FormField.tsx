"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
};

export const FormField = ({
  label,
  children,
  className,
  labelClassName,
}: FormFieldProps) => {
  return (
    <label className={clsx("grid gap-2 text-sm text-[var(--muted)]", className)}>
      <span className={clsx(labelClassName)}>{label}</span>
      {children}
    </label>
  );
};
