"use client";

import clsx from "clsx";
import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement>;

export const SelectField = ({ className, ...props }: SelectFieldProps) => {
  return <select className={clsx("input-field", className)} {...props} />;
};
