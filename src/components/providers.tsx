"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { ToastBridge } from "@/components/toast-bridge";

// 注册 axios-mock-adapter（内部自判 NEXT_PUBLIC_USE_MOCK 开关）
// 必须在客户端入口导入，否则各 API 模块直接引用 http.ts 不会触发 mock 注册
import "@/lib/api/mock";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <ToastBridge />
    </QueryClientProvider>
  );
}
