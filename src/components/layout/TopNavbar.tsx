"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, CircleUser, User, LayoutDashboard, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNavbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // 未登录：只渲染品牌区，隐藏右侧操作
  if (!user) {
    return (
      <nav className="sticky top-0 z-50 h-16 w-full border-b border-border bg-background">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
              AI 风格迁移
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            AI 风格迁移
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden text-sm text-muted-foreground sm:inline-flex">
            剩余额度：{user.quota ?? 0} 张
          </span>

          <Link href="/history">
            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              历史作品
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 pr-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <CircleUser className="h-5 w-5" />
                个人中心
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="h-4 w-4" />
                个人中心
              </DropdownMenuItem>
              {user.role === "ADMIN" && (
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  <LayoutDashboard className="h-4 w-4" />
                  管理后台
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-error"
                onClick={() => {
                  logout();
                  router.push("/auth");
                }}
              >
                <LogOut className="h-4 w-4" />
                登出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
