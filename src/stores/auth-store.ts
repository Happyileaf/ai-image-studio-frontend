"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, UserRole } from "@/types";

// 客户端 Cookie 同步：middleware 跑在 Edge runtime 无法读 localStorage/zustand，
// 只能读 cookie。这里把 auth_token / auth_role 镜像到 cookie，保证路由守卫生效。
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (data: { accessToken: string; refreshToken: string; user: User }) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: ({ accessToken, refreshToken, user }) => {
        set({ accessToken, refreshToken, user, isAuthenticated: true });
        setCookie("auth_token", accessToken);
        setCookie("auth_role", user.role);
      },
      updateUser: (patch) =>
        set((s) => {
          if (!s.user) return {};
          if (patch.role !== undefined && patch.role !== s.user.role) {
            setCookie("auth_role", patch.role);
          }
          return { user: { ...s.user, ...patch } };
        }),
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
        deleteCookie("auth_token");
        deleteCookie("auth_role");
      },
      hasRole: (role) => get().user?.role === role,
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
