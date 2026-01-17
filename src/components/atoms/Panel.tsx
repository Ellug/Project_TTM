"use client";

import clsx from "clsx";
import type { HTMLAttributes } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement>;

export const Panel = ({ className, ...props }: PanelProps) => {
  return <div className={clsx("panel", className)} {...props} />;
};
