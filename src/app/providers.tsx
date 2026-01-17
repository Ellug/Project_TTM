"use client";

import { AuthProvider } from "@/components/AuthProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
