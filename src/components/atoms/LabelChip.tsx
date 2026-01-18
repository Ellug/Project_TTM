"use client";

import clsx from "clsx";
import { Chip } from "@/components/atoms/Chip";

type LabelChipProps = {
  label: string;
  className?: string;
};

export const LabelChip = ({ label, className }: LabelChipProps) => {
  return (
    <Chip className={clsx("label-chip", className)} data-label={label}>
      {label}
    </Chip>
  );
};
