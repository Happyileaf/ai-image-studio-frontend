"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import {
  listHistoryImages,
  deleteHistoryImage,
  batchDeleteHistoryImages,
} from "@/lib/api/history";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HistoryGrid } from "@/components/history/HistoryGrid";
import type { GeneratedImageVO } from "@/types";

type DeleteTarget =
  | { type: "single"; id: number }
  | { type: "batch" }
  | null;

const PAGE_SIZE = 8;

export default function HistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["history", "images"],
    queryFn: () => listHistoryImages({ page: 1, size: 50 }),
  });
  const images = data?.list ?? [];

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const selectMode = selected.size > 0;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteHistoryImage(id),
    onSuccess: () => {
      toast({ title: "已删除" });
      queryClient.invalidateQueries({ queryKey: ["history", "images"] });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => batchDeleteHistoryImages(ids),
    onSuccess: () => {
      toast({ title: "已删除" });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["history", "images"] });
    },
  });

  function handleToggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDownload(img: GeneratedImageVO) {
    if (img.previewUrl) {
      window.open(img.previewUrl, "_blank");
    }
  }

  function handleBatchDownload() {
    if (selected.size === 0) return;
    toast({ title: "正在打包…" });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "single") {
      const id = deleteTarget.id;
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      });
    } else {
      batchDeleteMutation.mutate([...selected]);
    }
    setDeleteTarget(null);
  }

  const isDeleting =
    deleteMutation.isPending || batchDeleteMutation.isPending;
  const batchCount = selected.size;
  const visibleImages = images.slice(0, visibleCount);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Retention warning */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>作品默认保留 7 天，到期自动清理，请及时下载</span>
      </div>

      {/* Bulk action bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-static">
        <span className="text-sm font-medium text-card-foreground">
          已选 {batchCount} 张
        </span>
        <div className="flex items-center gap-2">
          <Button onClick={handleBatchDownload}>
            <Download className="h-4 w-4" />
            批量下载 (ZIP)
          </Button>
          {selectMode && (
            <>
              <Button
                variant="outline"
                className="text-error hover:bg-error/10 hover:text-error"
                onClick={() => setDeleteTarget({ type: "batch" })}
              >
                <Trash2 className="h-4 w-4" />
                批量删除
              </Button>
              <Button variant="ghost" onClick={() => setSelected(new Set())}>
                取消选择
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-static"
            >
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <ImageIcon className="h-12 w-12" />
          <p className="text-sm">暂无历史作品</p>
        </div>
      ) : (
        <HistoryGrid
          images={visibleImages}
          selectedIds={selected}
          onToggleSelect={handleToggleSelect}
          onDelete={(id) => setDeleteTarget({ type: "single", id })}
          onDownload={handleDownload}
          selectMode={selectMode}
        />
      )}

      {/* Load more (cosmetic — mock returns all) */}
      {!isLoading && images.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            disabled={visibleCount >= images.length}
          >
            加载更多
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === "batch"
                ? `确认删除选中的 ${batchCount} 项？删除后不可恢复。`
                : "确认删除该作品？删除后不可恢复。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中…" : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
