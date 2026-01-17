"use client";

import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement>;

export const InputField = ({ className, ...props }: InputFieldProps) => {
  return <input className={clsx("input-field", className)} {...props} />;
};
