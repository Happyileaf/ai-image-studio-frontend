"use client";

import { CheckCircle2, LoaderCircle, X } from "lucide-react";

import { useTaskStore, useUploadStore } from "@/stores";
import { cancelTask } from "@/lib/api/tasks";
import { useToast } from "@/hooks/use-toast";

export function ProcessingPanel() {
  const { toast } = useToast();
  const progress = useTaskStore((s) => s.progress);
  const taskId = useTaskStore((s) => s.taskId);
  const styleName = useTaskStore((s) => s.styleName);
  const results = useTaskStore((s) => s.results);
  const uploadCount = useUploadStore((s) => s.files.length);

  const total =
    progress && progress.total > 0
      ? progress.total
      : Math.max(1, uploadCount || 3);
  const pct = progress?.progress ?? 0;
  const success = progress?.success ?? 0;
  const currentItem = progress?.currentItem ?? 0;

  const handleCancel = async () => {
    if (taskId == null) return;
    try {
      await cancelTask(taskId);
    } catch {
      toast({
        variant: "destructive",
        title: "取消失败",
        description: "请稍后重试",
      });
    } finally {
      useTaskStore.getState().reset();
      useUploadStore.getState().clear();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            正在生成{styleName ? ` · ${styleName}风格` : ""}
          </h3>
          <p className="text-sm text-muted-foreground">
            正在处理 {Math.round(pct)}% · 已完成 {success}/{total}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 rounded-md border border-error/30 bg-error/10 px-4 py-2 text-sm font-medium text-error transition hover:bg-error/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
        >
          <X className="h-4 w-4" />
          取消任务
        </button>
      </div>

      {/* 整体进度条 */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>整体进度</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 处理中网格 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: total }).map((_, i) => {
          if (i < success) {
            const r = results[i];
            if (r?.previewUrl) {
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-lg border border-border bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.previewUrl}
                    alt={`结果 ${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </div>
              );
            }
            return (
              <div
                key={i}
                className="relative flex aspect-square items-center justify-center rounded-lg border border-border bg-card text-success"
              >
                <CheckCircle2 className="h-8 w-8" />
              </div>
            );
          }
          if (i === currentItem) {
            return (
              <div
                key={i}
                className="relative flex aspect-square items-center justify-center rounded-lg border border-border bg-card"
              >
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            );
          }
          return (
            <div
              key={i}
              className="relative flex aspect-square items-center justify-center rounded-lg border border-border bg-muted/40"
            />
          );
        })}
      </div>
    </div>
  );
}

export default ProcessingPanel;
