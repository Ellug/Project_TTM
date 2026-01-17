"use client";

import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextAreaField = ({ className, ...props }: TextAreaFieldProps) => {
  return <textarea className={clsx("input-field", className)} {...props} />;
};
