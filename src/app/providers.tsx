"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
