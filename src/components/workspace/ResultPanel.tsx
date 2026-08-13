"use client";

import { useRouter } from "next/navigation";
import { Download, Eye, History, RotateCcw } from "lucide-react";

import { useTaskStore, useUploadStore } from "@/stores";
import { downloadTaskResults } from "@/lib/api/tasks";
import { useToast } from "@/hooks/use-toast";

export function ResultPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const results = useTaskStore((s) => s.results);
  const taskId = useTaskStore((s) => s.taskId);
  const styleName = useTaskStore((s) => s.styleName);

  const handleNewTask = () => {
    useTaskStore.getState().reset();
    useUploadStore.getState().clear();
  };

  const handleRegenerate = () => {
    useTaskStore.getState().reset();
  };

  const handleDownloadAll = async () => {
    if (taskId == null) return;
    try {
      const blob = await downloadTaskResults(taskId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `task-${taskId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        variant: "destructive",
        title: "下载失败",
        description: "打包下载失败，请稍后重试",
      });
    }
  };

  const handlePreview = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadOne = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            生成完成{styleName ? ` · ${styleName}风格` : ""}
          </h3>
          <p className="text-sm text-muted-foreground">
            共 {results.length} 张 · 已扣除 {results.length} 张额度
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNewTask}
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            新建任务
          </button>
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4" />
            下载全部
          </button>
        </div>
      </div>

      {/* 结果网格 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {results.map((r) => (
          <div
            key={r.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.previewUrl}
              alt={r.fileName}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="truncate text-xs text-white">{r.fileName}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="预览"
                  onClick={() => handlePreview(r.previewUrl)}
                  className="rounded-md bg-white/20 p-1.5 text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="下载"
                  onClick={() => handleDownloadOne(r.previewUrl, r.fileName)}
                  className="rounded-md bg-white/20 p-1.5 text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRegenerate}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-4 w-4" />
          重新生成
        </button>
        <button
          type="button"
          onClick={() => router.push("/history")}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <History className="h-4 w-4" />
          查看历史作品
        </button>
      </div>
    </div>
  );
}

export default ResultPanel;
