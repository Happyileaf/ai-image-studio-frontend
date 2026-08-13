"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
} from "lucide-react";
import { adjustUserQuota, listUsers, updateUserStatus } from "@/lib/api/admin";
import { useToast } from "@/hooks/use-toast";
import type { UserStatus, UserVO } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PLAN_OPTIONS = ["免费版", "专业版", "团队版"];

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function formatNumber(n: number): string {
  return n.toLocaleString("zh-CN");
}

function planBadgeClass(plan: string): string {
  if (plan === "团队版") return "bg-warning/10 text-warning";
  if (plan === "专业版") return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quotaTarget, setQuotaTarget] = useState<UserVO | null>(null);
  const [quotaDelta, setQuotaDelta] = useState<string>("");

  const { data: page, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsers({ page: 1, size: 20 }),
  });

  const users = page?.list ?? [];

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return users.filter((u) => {
      if (
        kw &&
        !u.email.toLowerCase().includes(kw) &&
        !String(u.id).includes(kw)
      )
        return false;
      if (statusFilter !== "all" && String(u.status) !== statusFilter)
        return false;
      if (planFilter !== "all" && (u.plan ?? "免费版") !== planFilter)
        return false;
      return true;
    });
  }, [users, keyword, statusFilter, planFilter]);

  const quotaMutation = useMutation({
    mutationFn: (vars: { id: number; delta: number }) =>
      adjustUserQuota(vars.id, { delta: vars.delta }),
    onSuccess: () => {
      toast({ title: "额度已更新" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setQuotaTarget(null);
      setQuotaDelta("");
    },
    onError: () => {
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: number; status: UserStatus }) =>
      updateUserStatus(vars.id, vars.status),
    onSuccess: () => {
      toast({ title: "状态已更新" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => {
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    },
  });

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map((u) => u.id)) : new Set());
  };

  const allChecked =
    filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id));

  const handleSaveQuota = () => {
    if (!quotaTarget) return;
    const delta = Number(quotaDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      toast({
        title: "请输入有效的额度变化",
        variant: "destructive",
      });
      return;
    }
    quotaMutation.mutate({ id: quotaTarget.id, delta });
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
            placeholder="搜索邮箱或用户 ID"
            className="h-9 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="1">正常</SelectItem>
            <SelectItem value="0">禁用</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="全部套餐" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部套餐</SelectItem>
            {PLAN_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        {selectedIds.size > 0 ? (
          <div className="border-b border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
            已选 {selectedIds.size} 项 · 批量操作
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[44px]">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead>用户 ID</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>套餐</TableHead>
              <TableHead>剩余额度</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  暂无匹配用户
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const active = u.status === 1;
                const plan = u.plan ?? "免费版";
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(u.id)}
                        onCheckedChange={(v) => toggleSelect(u.id, Boolean(v))}
                        aria-label={`选择 ${u.email}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      usr_{u.id}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${planBadgeClass(plan)}`}
                      >
                        {plan}
                      </span>
                    </TableCell>
                    <TableCell>{formatNumber(u.quota)} 张</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {active ? "正常" : "禁用"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setQuotaTarget(u);
                            setQuotaDelta("");
                          }}
                          aria-label="编辑额度"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-error/10 hover:text-error"
                            onClick={() =>
                              statusMutation.mutate({ id: u.id, status: 0 })
                            }
                            aria-label="禁用"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-success/10 hover:text-success"
                            onClick={() =>
                              statusMutation.mutate({ id: u.id, status: 1 })
                            }
                            aria-label="启用"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination footer (cosmetic — mock returns a single page) */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">
            共 {filtered.length} 条 · 每页 20 条
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 text-sm font-medium"
            >
              1
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑额度 Dialog */}
      <Dialog
        open={quotaTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setQuotaTarget(null);
            setQuotaDelta("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑额度</DialogTitle>
            <DialogDescription>
              调整用户 {quotaTarget?.email} 的剩余额度。正数增加，负数减少。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              额度变化（张）
            </label>
            <Input
              type="number"
              value={quotaDelta}
              onChange={(e) => setQuotaDelta(e.target.value)}
              placeholder="例如：100 或 -50"
            />
            {quotaTarget ? (
              <p className="text-xs text-muted-foreground">
                当前额度：{formatNumber(quotaTarget.quota)} 张
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQuotaTarget(null);
                setQuotaDelta("");
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveQuota}
              disabled={quotaMutation.isPending}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
