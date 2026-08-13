"use client";

import { Download, Trash2 } from "lucide-react";

import type { GeneratedImageVO } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface HistoryGridProps {
  images: GeneratedImageVO[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (img: GeneratedImageVO) => void;
  selectMode: boolean;
}

export function HistoryGrid({
  images,
  selectedIds,
  onToggleSelect,
  onDelete,
  onDownload,
  selectMode,
}: HistoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {images.map((img) => {
        const checked = selectedIds.has(img.id);
        const showCheckbox = selectMode || checked;
        const isExpiring = img.daysLeft <= 3;
        const isHealthy = img.daysLeft >= 5;

        return (
          <article
            key={img.id}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border bg-card shadow-static transition-shadow hover:shadow-floating",
              checked && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            {/* Thumbnail (click toggles select) */}
            <div
              role="button"
              tabIndex={0}
              aria-label={`选择 ${img.styleName}`}
              onClick={() => onToggleSelect(img.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleSelect(img.id);
                }
              }}
              className="relative block aspect-square w-full cursor-pointer overflow-hidden bg-muted"
            >
              <img
                src={img.previewUrl}
                alt={img.styleName}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="pointer-events-none absolute inset-x-2 bottom-2 truncate text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {img.styleName}
              </span>

              {/* Checkbox: visible on hover, or when selectMode / checked */}
              <div
                className={cn(
                  "absolute left-2 top-2 transition-opacity",
                  showCheckbox
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggleSelect(img.id)}
                  aria-label={checked ? "取消选择" : "选择"}
                  className="h-5 w-5 border-white/70 bg-white/20 backdrop-blur-sm data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            {/* Meta + actions */}
            <div className="flex items-center justify-between p-3">
              <p className="truncate text-sm font-medium text-card-foreground">
                {img.styleName} · {img.relativeTime}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    isExpiring
                      ? "bg-warning/10 text-warning"
                      : isHealthy
                        ? "bg-success/10 text-success"
                        : "bg-info/10 text-info",
                  )}
                >
                  剩 {img.daysLeft} 天
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onDownload(img)}
                  aria-label="下载"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:bg-error/10 hover:text-error"
                  onClick={() => onDelete(img.id)}
                  aria-label="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
