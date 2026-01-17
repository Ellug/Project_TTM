"use client";

import clsx from "clsx";
import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { buttonVariantClasses, type ButtonVariant } from "./Button";

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

export const ButtonLink = ({
  variant = "secondary",
  className,
  children,
  ...props
}: ButtonLinkProps) => {
  return (
    <Link className={clsx(buttonVariantClasses[variant], className)} {...props}>
      {children}
    </Link>
  );
};
