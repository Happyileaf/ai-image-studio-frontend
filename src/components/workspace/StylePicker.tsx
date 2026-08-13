"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { listStyles } from "@/lib/api/styles";
import type { Style, StyleCategory } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CategoryTab = "ALL" | StyleCategory;

const TABS: { value: CategoryTab; label: string }[] = [
  { value: "ALL", label: "全部" },
  { value: "PAINTING", label: "绘画" },
  { value: "PHOTO", label: "摄影" },
  { value: "ART", label: "艺术" },
];

interface StylePickerProps {
  value: Style | null;
  onChange: (style: Style) => void;
  disabled?: boolean;
}

export function StylePicker({ value, onChange, disabled = false }: StylePickerProps) {
  const [category, setCategory] = useState<CategoryTab>("ALL");

  const { data: styles, isLoading } = useQuery({
    queryKey: ["styles"],
    queryFn: () => listStyles(),
  });

  const filtered = (styles ?? []).filter(
    (s) => category === "ALL" || s.category === category,
  );

  return (
    <div className={cn(disabled && "pointer-events-none opacity-60")}>
      <Tabs
        value={category}
        onValueChange={(v) => setCategory(v as CategoryTab)}
      >
        <TabsList className="h-auto flex-wrap gap-1.5 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/80 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))
          : filtered.map((style) => {
              const selected = value?.id === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => !disabled && onChange(style)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-md border border-border bg-card p-1 text-left transition hover:border-primary/50",
                    selected && "ring-2 ring-primary",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={style.coverUrl}
                    alt={style.name}
                    className="h-8 w-8 shrink-0 rounded-sm object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {style.name}
                  </span>
                  {selected && (
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2 w-2" />
                    </span>
                  )}
                </button>
              );
            })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">暂无可用风格</p>
      )}
    </div>
  );
}

export default StylePicker;
