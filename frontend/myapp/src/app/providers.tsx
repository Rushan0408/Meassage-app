"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
} 