"use client";

import clsx from "clsx";
import type { HTMLAttributes } from "react";

type ChipProps = HTMLAttributes<HTMLSpanElement>;

export const Chip = ({ className, ...props }: ChipProps) => {
  return <span className={clsx("chip", className)} {...props} />;
};
