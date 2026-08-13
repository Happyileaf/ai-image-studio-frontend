"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function ForbiddenToast() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    const params = new URLSearchParams(search);
    if (params.get("forbidden") === "1") {
      toast({ title: "无权访问管理后台", variant: "destructive" });
      // 清理 URL 中的 forbidden 参数，保证只 toast 一次
      params.delete("forbidden");
      const query = params.toString();
      const cleanUrl =
        window.location.pathname + (query ? `?${query}` : "") + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [toast]);

  return null;
}
