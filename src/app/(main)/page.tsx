"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { UploadZone } from "@/components/workspace/UploadZone";
import { StylePicker } from "@/components/workspace/StylePicker";
import { ProcessingPanel } from "@/components/workspace/ProcessingPanel";
import { ResultPanel } from "@/components/workspace/ResultPanel";
import { Button } from "@/components/ui/button";
import { useAuthStore, useTaskStore, useUploadStore } from "@/stores";
import { createTask } from "@/lib/api/tasks";
import { useTaskProgress } from "@/hooks/use-task-progress";
import { cn } from "@/lib/utils";
import type { Style } from "@/types";
import { useToast } from "@/hooks/use-toast";

const MAX_FILES = 9;

export default function MainPage() {
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const { toast } = useToast();

  // 启动生成进度模拟器（phase === "processing" 时跑 mock 定时器）
  useTaskProgress();

  const phase = useTaskStore((s) => s.phase);
  const startProcessing = useTaskStore((s) => s.startProcessing);
  const user = useAuthStore((s) => s.user);

  const { files, count } = useUploadStore(
    useShallow((s) => ({ files: s.files, count: s.count })),
  );

  const isIdle = phase === "idle";
  const imageCount = count();
  const quota = user?.quota ?? 0;
  const hasUploading = files.some((f) => f.status === "uploading");

  const generateDisabled =
    !isIdle ||
    !selectedStyle ||
    imageCount === 0 ||
    hasUploading ||
    quota < imageCount;

  const createMutation = useMutation({
    mutationFn: (vars: { fileKeys: string[]; styleId: number }) =>
      createTask({ fileKeys: vars.fileKeys, styleId: vars.styleId }),
    onSuccess: (data) => {
      if (selectedStyle) {
        startProcessing(data.taskId, selectedStyle.name);
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "生成任务创建失败";
      toast({ variant: "destructive", title: "生成失败", description: msg });
    },
  });

  const handleGenerate = () => {
    if (generateDisabled || !selectedStyle) return;
    const fileKeys = files
      .filter((f) => f.status === "done" && f.fileKey)
      .map((f) => f.fileKey as string);
    if (fileKeys.length === 0) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先上传图片",
      });
      return;
    }
    createMutation.mutate({ fileKeys, styleId: selectedStyle.id });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* 左列：上传 + 风格 + 摘要 */}
      <section className="flex min-w-0 flex-col border-b border-border bg-background p-4 lg:w-[30%] lg:border-b-0 lg:border-r">
        <h1 className="mb-3 text-sm font-semibold text-foreground">上传图片</h1>
        <UploadZone disabled={!isIdle} />

        <div className="mt-6 flex-1">
          <h2 className="mb-2.5 text-sm font-semibold text-foreground">选择风格</h2>
          <StylePicker
            value={selectedStyle}
            onChange={setSelectedStyle}
            disabled={!isIdle}
          />
        </div>

        {/* 摘要栏 */}
        <div className="mt-auto border-t border-border bg-background/95 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">已选风格</span>
            <span className="font-medium text-foreground">
              {selectedStyle?.name ?? "未选择"}
            </span>
          </div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">图片数</span>
            <span className="font-medium text-foreground">
              {imageCount} / {MAX_FILES} 张
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">本次扣减</span>
            <span className="font-medium text-foreground">
              {imageCount} 张 / 剩余 {quota} 张
            </span>
          </div>
          <Button
            className="w-full rounded-md text-xs font-semibold"
            size="default"
            disabled={generateDisabled || createMutation.isPending}
            onClick={handleGenerate}
          >
            {createMutation.isPending ? "提交中…" : "立即生成 →"}
          </Button>
        </div>
      </section>

      {/* 右列：空闲占位 / 生成中 / 结果 */}
      <section
        className={cn(
          "flex flex-1 flex-col bg-muted/30 p-8",
          isIdle
            ? "items-center justify-center text-center"
            : "overflow-y-auto",
        )}
      >
        {phase === "idle" ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-primary/60">
              <ImagePlus className="h-8 w-8" />
            </div>
            <h3 className="mb-1.5 text-base font-semibold text-foreground">
              上传图片并选择风格，一键生成艺术作品
            </h3>
            <p className="max-w-md text-xs text-muted-foreground">
              你的原图将在任务完成后立即删除，绝不会被保留
            </p>
          </>
        ) : phase === "processing" ? (
          <ProcessingPanel />
        ) : (
          <ResultPanel />
        )}
      </section>
    </div>
  );
}
