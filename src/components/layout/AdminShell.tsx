"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Palette,
  Clock,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/stores";

const NAV_ITEMS = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/styles", label: "风格库管理", icon: Palette },
  { href: "/admin/tasks", label: "任务监控", icon: Clock },
  { href: "/admin/settings", label: "系统配置", icon: Settings },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "仪表盘",
  "/admin/users": "用户管理",
  "/admin/styles": "风格库管理",
  "/admin/tasks": "任务监控",
  "/admin/settings": "系统配置",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const pageTitle = PAGE_TITLES[pathname] ?? "管理后台";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-4">
          <span className="text-base font-semibold text-foreground">
            AI 风格迁移 · 管理后台
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="fixed left-[240px] right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="text-sm font-medium text-foreground">{pageTitle}</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.email ?? ""}
          </span>
          <Link
            href="/auth"
            onClick={() => logout()}
          >
            <span className="text-sm font-medium text-error hover:text-error/90">
              退出管理后台
            </span>
          </Link>
        </div>
      </header>

      <main className="ml-[240px] mt-16 min-h-[calc(100vh-4rem)] bg-muted p-6">
        {children}
      </main>
    </>
  );
}
