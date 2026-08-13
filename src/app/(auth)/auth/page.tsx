"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Mail, Lock, KeyRound } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordStrengthBar from "@/components/auth/password-strength";
import { useAuthStore } from "@/stores";
import { useToast } from "@/hooks/use-toast";
import { login, register, sendCode } from "@/lib/api/auth";

const loginSchema = z.object({
  email: z.email("请输入有效的邮箱"),
  password: z.string().min(1, "请输入密码"),
});

const registerSchema = z
  .object({
    email: z.email("请输入有效的邮箱"),
    code: z.string().regex(/^\d{6}$/, "请输入 6 位数字验证码"),
    password: z.string().min(8, "密码至少 8 位"),
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", code: "", password: "", confirmPassword: "" },
  });

  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const onLogin = async (values: LoginFormValues) => {
    const { accessToken, refreshToken, user } = await login(values);
    useAuthStore.getState().setAuth({ accessToken, refreshToken, user });
    router.push("/");
  };

  const onRegister = async (values: RegisterFormValues) => {
    const { confirmPassword: _confirmPassword, ...payload } = values;
    const { accessToken, refreshToken, user } = await register(payload);
    useAuthStore.getState().setAuth({ accessToken, refreshToken, user });
    toast({ title: "注册成功" });
    router.push("/");
  };

  const handleSendCode = async () => {
    const valid = await registerForm.trigger("email");
    if (!valid) return;
    const email = registerForm.getValues("email");
    try {
      await sendCode({ email, purpose: "REGISTER" });
      toast({ title: "验证码已发送", description: "请查收邮件" });
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // 错误信息由全局 toast 处理
    }
  };

  const registerPassword = registerForm.watch("password");

  return (
    <section
      className="relative flex flex-1 overflow-hidden"
      aria-label="登录 / 注册"
    >
      {/* Left visual panel */}
      <div className="relative hidden w-[40%] flex-col justify-between overflow-hidden lg:flex">
        <img
          src="/auth-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent" />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            <span className="text-xl font-semibold tracking-tight">
              AI 风格迁移
            </span>
          </div>
          <div className="space-y-4">
            <h2 className="max-w-xs text-3xl font-bold leading-tight">
              保留内容，
              <br />
              改变视觉表达
            </h2>
            <p className="max-w-xs text-sm text-primary-foreground/80">
              智能语义分割 + 艺术风格迁移，让每一张图片都保留故事，焕发全新美感。
            </p>
          </div>
          <p className="text-xs text-primary-foreground/70">
            登录即代表同意《服务条款》与《隐私政策》，我们严格保护您的数据安全。
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-6 lg:w-[60%] lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full rounded-lg bg-muted p-1">
              <TabsTrigger value="login" className="flex-1">
                登录
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                注册
              </TabsTrigger>
            </TabsList>

            {/* Login form */}
            <TabsContent value="login" className="mt-6">
              <form
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
                aria-label="登录表单"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...loginForm.register("email")}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-error">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="请输入密码"
                      className="pl-10"
                      {...loginForm.register("password")}
                    />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-error">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="mt-2 h-11 w-full"
                >
                  {loginForm.formState.isSubmitting ? "登录中…" : "登录"}
                </Button>
              </form>
            </TabsContent>

            {/* Register form */}
            <TabsContent value="register" className="mt-6">
              <form
                onSubmit={registerForm.handleSubmit(onRegister)}
                className="space-y-4"
                aria-label="注册表单"
              >
                <div className="space-y-2">
                  <Label htmlFor="register-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...registerForm.register("email")}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-error">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-code">验证码</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="register-code"
                        type="text"
                        inputMode="numeric"
                        placeholder="6 位验证码"
                        className="pl-10"
                        {...registerForm.register("code")}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendCode}
                      disabled={countdown > 0}
                      className="whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
                    </Button>
                  </div>
                  {registerForm.formState.errors.code && (
                    <p className="text-xs text-error">
                      {registerForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="设置 8 位以上密码"
                      className="pl-10"
                      {...registerForm.register("password")}
                    />
                  </div>
                  <PasswordStrengthBar password={registerPassword} />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-error">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm">确认密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="再次输入密码"
                      className="pl-10"
                      {...registerForm.register("confirmPassword")}
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-error">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  className="mt-2 h-11 w-full"
                >
                  {registerForm.formState.isSubmitting ? "注册中…" : "注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            未收到验证码？请检查垃圾邮件箱或联系客服 support@aistudio.example
          </p>
        </div>
      </div>
    </section>
  );
}
