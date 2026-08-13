"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";

import { useAuthStore } from "@/stores";
import { useToast } from "@/hooks/use-toast";
import { changePassword } from "@/lib/api/users";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PasswordStrengthBar from "@/components/auth/password-strength";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z.string().min(8, "新密码至少 8 位"),
    confirmPassword: z.string().min(1, "请确认新密码"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的密码不一致",
  });

type FormValues = z.infer<typeof formSchema>;

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword");

  const onSubmit = async (values: FormValues) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast({ title: "密码修改成功" });
      reset();
    } catch {
      // 错误提示由全局 axios 拦截器（toastFn）统一处理
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6">
      {/* 个人信息 */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">
          个人信息
        </h2>
        {user ? (
          <div className="space-y-3">
            <InfoRow label="邮箱">{user.email}</InfoRow>
            {user.nickname ? <InfoRow label="昵称">{user.nickname}</InfoRow> : null}
            <InfoRow label="角色">
              {user.role === "ADMIN" ? (
                <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  管理员
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  普通用户
                </span>
              )}
            </InfoRow>
            <InfoRow label="剩余额度">{user.quota ?? 0} 张</InfoRow>
            <InfoRow label="注册时间">{formatDate(user.createdAt)}</InfoRow>
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        )}
      </section>

      {/* 修改密码 */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">
          修改密码
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">当前密码</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="请输入当前密码"
                className="pl-10"
                {...register("currentPassword")}
              />
            </div>
            {errors.currentPassword ? (
              <p className="text-xs text-error">
                {errors.currentPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">新密码</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="请输入新密码"
                className="pl-10"
                {...register("newPassword")}
              />
            </div>
            {errors.newPassword ? (
              <p className="text-xs text-error">{errors.newPassword.message}</p>
            ) : null}
            <PasswordStrengthBar password={newPasswordValue ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="请再次输入新密码"
                className="pl-10"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword ? (
              <p className="text-xs text-error">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "保存中…" : "保存修改"}
          </Button>
        </form>
      </section>
    </div>
  );
}
