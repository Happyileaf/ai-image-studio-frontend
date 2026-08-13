"use client";

import { useCallback, useRef, useState } from "react";
import { LoaderCircle, Plus, Upload, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { useUploadStore } from "@/stores";
import { uploadImage } from "@/lib/api/images";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MAX_FILES = 9;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp";

interface UploadZoneProps {
  disabled?: boolean;
}

export function UploadZone({ disabled = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const { files, addFiles, removeFile, markUploaded, markError, canAddMore } =
    useUploadStore(
      useShallow((s) => ({
        files: s.files,
        addFiles: s.addFiles,
        removeFile: s.removeFile,
        markUploaded: s.markUploaded,
        markError: s.markError,
        canAddMore: s.canAddMore,
      })),
    );

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (disabled) return;
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const valid: File[] = [];
      let hasInvalid = false;
      for (const file of incoming) {
        const typeOk = ACCEPTED_TYPES.includes(file.type);
        const sizeOk = file.size <= MAX_FILE_SIZE;
        if (typeOk && sizeOk) {
          valid.push(file);
        } else {
          hasInvalid = true;
        }
      }

      if (hasInvalid) {
        toast({
          variant: "destructive",
          title: "上传失败",
          description: "仅支持 JPG/PNG/WebP，且单张不超过 10MB",
        });
      }

      if (valid.length === 0 || !canAddMore()) return;

      // addFiles 会按 1~9 上限截断，返回被接受的本地 id（顺序与 valid 对应）
      const ids = addFiles(valid);
      ids.forEach((id, idx) => {
        const file = valid[idx];
        uploadImage(file)
          .then((res) => {
            markUploaded(id, res.fileKey, res.previewUrl);
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "上传失败";
            markError(id, msg);
          });
      });
    },
    [disabled, addFiles, canAddMore, markError, markUploaded, toast],
  );

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
      // 允许再次选择同一个文件
      e.target.value = "";
    },
    [handleFiles],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragging(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const showAddTile = !disabled && canAddMore();

  return (
    <div className={cn(disabled && "pointer-events-none opacity-60")}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {/* 拖拽 / 点击上传区 */}
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-3 text-center transition hover:border-primary/50 hover:bg-muted",
          isDragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-background text-primary shadow-sm">
          <Upload className="h-[18px] w-[18px]" />
        </div>
        <p className="text-sm font-medium text-foreground">
          拖拽图片到此处，或点击选择
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          1~9 张 · 单张 ≤ 10MB · JPG/PNG/WebP
        </p>
      </div>

      {/* 缩略图网格 */}
      {files.length > 0 && (
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              title={f.status === "error" ? f.error ?? "上传失败" : undefined}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border border-border bg-muted",
                f.status === "uploading" && "opacity-70",
                f.status === "error" && "ring-2 ring-error",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.previewUrl}
                alt={f.file.name}
                className="h-full w-full object-cover"
              />
              {f.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <LoaderCircle className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              {!disabled && (
                <button
                  type="button"
                  aria-label="移除图片"
                  onClick={() => removeFile(f.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {showAddTile && (
            <button
              type="button"
              onClick={openPicker}
              aria-label="继续添加图片"
              className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* 计数 */}
      <div className="mt-2 flex items-center justify-end text-xs text-muted-foreground">
        <span>
          {files.length}/{MAX_FILES} 张
          {files.length >= MAX_FILES ? " · 已达上限" : ""}
        </span>
      </div>
    </div>
  );
}

export default UploadZone;
