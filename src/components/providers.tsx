"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ROLE_MODULES, type ModuleKey, type Role } from "@/lib/permissions";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ---- Auth context (UI-only role gating) ----

interface AuthState {
  role: Role | null;
  setRole: (role: Role | null) => void;
  can: (module: ModuleKey) => boolean;
}

const AuthContext = createContext<AuthState>({
  role: null,
  setRole: () => undefined,
  can: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: ReactNode }) {
  // Single-role console: always Super Admin.
  const value = useMemo<AuthState>(
    () => ({
      role: "super_admin",
      setRole: () => undefined,
      can: (m) => ROLE_MODULES["super_admin"]?.includes(m) ?? false,
    }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}
