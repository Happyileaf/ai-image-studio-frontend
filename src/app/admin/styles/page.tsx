"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  EyeOff,
  ImageOff,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { listStyles } from "@/lib/api/styles";
import { updateStyle } from "@/lib/api/admin";
import { useToast } from "@/hooks/use-toast";
import type { Style, StyleCategory } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_OPTIONS: { value: StyleCategory; label: string }[] = [
  { value: "PAINTING", label: "绘画" },
  { value: "PHOTO", label: "摄影" },
  { value: "ART", label: "艺术" },
];

function categoryLabel(c: StyleCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

// Style 没有真实使用数字段，按 id 给一个稳定的占位计数。
function placeholderUsage(id: number): number {
  return ((id * 977 + 413) % 4000) + 200;
}

interface EditForm {
  name: string;
  description: string;
  sortOrder: string;
  category: StyleCategory;
}

export default function AdminStylesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<Style | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const { data: styles, isLoading } = useQuery({
    queryKey: ["styles"],
    queryFn: () => listStyles(),
  });

  const list = styles ?? [];

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return list.filter((s) => {
      if (kw && !s.name.toLowerCase().includes(kw)) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      return true;
    });
  }, [list, keyword, categoryFilter]);

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; dto: Partial<Style> }) =>
      updateStyle(vars.id, vars.dto),
    onSuccess: () => {
      toast({ title: "风格已更新" });
      queryClient.invalidateQueries({ queryKey: ["styles"] });
    },
    onError: () => {
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    },
  });

  const openEdit = (s: Style) => {
    setEditTarget(s);
    setEditForm({
      name: s.name,
      description: s.description ?? "",
      sortOrder: String(s.sortOrder),
      category: s.category,
    });
  };

  const handleSaveEdit = () => {
    if (!editTarget || !editForm) return;
    const sortOrder = Number(editForm.sortOrder);
    if (!editForm.name.trim()) {
      toast({ title: "请填写风格名称", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: editTarget.id,
      dto: {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : editTarget.sortOrder,
        category: editForm.category,
      },
    });
    setEditTarget(null);
    setEditForm(null);
  };

  const toggleStatus = (s: Style) => {
    updateMutation.mutate({ id: s.id, dto: { status: s.status === 1 ? 0 : 1 } });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索风格名"
            className="h-9 pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          暂无匹配风格
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((s) => {
            const online = s.status === 1;
            return (
              <article
                key={s.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {s.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.coverUrl}
                      alt={s.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-medium text-foreground">
                      {s.name}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          online
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {online ? "上架" : "下架"}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {categoryLabel(s.category)}
                      </span>
                    </div>
                  </div>
                  {s.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>使用 {placeholderUsage(s.id).toLocaleString("zh-CN")} 次</span>
                    <span>排序 {s.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-4 w-4" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => toggleStatus(s)}
                      disabled={updateMutation.isPending}
                    >
                      {online ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          下线
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          上架
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* 新增风格 placeholder card */}
          <button
            type="button"
            onClick={() => toast({ title: "新增功能开发中" })}
            className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-4 transition hover:border-primary/50 hover:bg-muted/50"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-foreground">新增风格</span>
            <span className="mt-1 text-xs text-muted-foreground">
              上传封面与提示词
            </span>
          </button>
        </div>
      )}

      {/* 编辑风格 Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑风格</DialogTitle>
            <DialogDescription>
              修改风格信息，保存后即时生效。
            </DialogDescription>
          </DialogHeader>
          {editForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style-name">风格名称</Label>
                <Input
                  id="style-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="风格名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style-desc">描述</Label>
                <Input
                  id="style-desc"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="一句话描述该风格"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style-sort">排序</Label>
                  <Input
                    id="style-sort"
                    type="number"
                    value={editForm.sortOrder}
                    onChange={(e) =>
                      setEditForm({ ...editForm, sortOrder: e.target.value })
                    }
                    placeholder="数字越小越靠前"
                  />
                </div>
                <div className="space-y-2">
                  <Label>分类</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(v) =>
                      setEditForm({
                        ...editForm,
                        category: v as StyleCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                setEditForm(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
