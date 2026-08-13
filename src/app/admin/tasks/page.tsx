"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { listAdminTasks } from "@/lib/api/admin";
import { getTask } from "@/lib/api/tasks";
import { listStyles } from "@/lib/api/styles";
import { useToast } from "@/hooks/use-toast";
import type { TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---------- helpers ---------- */

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "全部" },
  { value: "PENDING", label: "待处理" },
  { value: "PROCESSING", label: "处理中" },
  { value: "SUCCESS", label: "成功" },
  { value: "FAILED", label: "失败" },
  { value: "CANCELED", label: "已取消" },
];

// TaskStatus 与 TaskItemStatus 取值一致，共用一份映射
const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  PENDING: { label: "待处理", className: "bg-muted text-muted-foreground" },
  PROCESSING: { label: "处理中", className: "bg-warning/10 text-warning" },
  SUCCESS: { label: "成功", className: "bg-success/10 text-success" },
  FAILED: { label: "失败", className: "bg-error/10 text-error" },
  CANCELED: { label: "已取消", className: "bg-muted text-muted-foreground" },
};

function formatDateTime(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.PENDING;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm text-foreground",
          mono && "font-mono text-xs break-all",
        )}
      >
        {value === null || value === undefined || value === "" ? "-" : value}
      </dd>
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminTasksPage() {
  const { toast } = useToast();

  // 过滤条件
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [styleFilter, setStyleFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 详情抽屉
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: tasksPage, isLoading } = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: () => listAdminTasks({ page: 1, size: 50 }),
  });

  const { data: styles } = useQuery({
    queryKey: ["styles"],
    queryFn: () => listStyles(),
  });

  const {
    data: detail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ["task", selectedId],
    queryFn: () => getTask(selectedId!),
    enabled: selectedId !== null,
  });

  const tasks = tasksPage?.list ?? [];
  const total = tasksPage?.total ?? 0;

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return tasks.filter((t) => {
      if (kw) {
        const matchNo = t.taskNo?.toLowerCase().includes(kw);
        const matchId = String(t.id).includes(kw);
        const matchUser = String(t.userId).includes(kw);
        if (!matchNo && !matchId && !matchUser) return false;
      }
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (styleFilter !== "ALL" && String(t.styleId) !== styleFilter)
        return false;
      const created = new Date(t.createdAt).getTime();
      if (fromTime !== null && created < fromTime) return false;
      if (toTime !== null && created > toTime) return false;
      return true;
    });
  }, [tasks, keyword, statusFilter, styleFilter, dateFrom, dateTo]);

  const hasFailedItems = (detail?.items ?? []).some(
    (i) => i.status === "FAILED",
  );

  const handleRetry = () => {
    if (!detail || !hasFailedItems) return;
    // mock：仅提示，避免对未实现的 /tasks/:id/retry 发起真实请求
    toast({ title: "重试请求已发送" });
  };

  const closeDrawer = () => setSelectedId(null);

  return (
    <div className="space-y-6">
      {/* ---- 过滤栏 ---- */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="任务 ID 或 用户邮箱"
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-36">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-36">
          <Select value={styleFilter} onValueChange={setStyleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="风格" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部风格</SelectItem>
              {(styles ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">起始</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">结束</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* ---- 任务表 ---- */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>任务编号</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>风格</TableHead>
                  <TableHead>图片数</TableHead>
                  <TableHead>成功 / 失败</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      暂无任务
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-xs break-all">
                        {task.taskNo}
                      </TableCell>
                      <TableCell>用户 #{task.userId}</TableCell>
                      <TableCell>{task.styleName ?? "-"}</TableCell>
                      <TableCell>{task.imageCount}</TableCell>
                      <TableCell>
                        <span className="text-success">{task.successCount}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-error">{task.failCount}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(task.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedId(task.id)}
                        >
                          <Eye className="h-4 w-4" />
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* 分页（mock 一次性返回全部，仅展示） */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">
                共 {total} 条
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="default" size="icon">
                  1
                </Button>
                <Button variant="outline" size="icon" disabled>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ---- 详情抽屉（自定义右侧滑出面板） ---- */}
      {selectedId !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closeDrawer}
            aria-hidden
          />
          <aside className="fixed right-0 top-16 bottom-0 z-50 flex w-[480px] flex-col border-l border-border bg-card">
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-base font-semibold text-foreground">
                任务详情
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrawer}
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 内容 */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {detailLoading || !detail ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <>
                  {/* 基本信息 */}
                  <section>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      基本信息
                    </h4>
                    <dl className="grid grid-cols-2 gap-y-3">
                      <InfoRow label="任务编号" value={detail.taskNo} mono />
                      <InfoRow label="用户ID" value={`#${detail.userId}`} />
                      <InfoRow label="风格" value={detail.styleName} />
                      <InfoRow label="图片数" value={detail.imageCount} />
                      <InfoRow
                        label="状态"
                        value={<StatusBadge status={detail.status} />}
                      />
                      <InfoRow
                        label="创建时间"
                        value={formatDateTime(detail.createdAt)}
                      />
                      <InfoRow
                        label="完成时间"
                        value={formatDateTime(detail.finishedAt)}
                      />
                    </dl>
                  </section>

                  {/* 额度流水 */}
                  <section>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      额度流水
                    </h4>
                    <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                      扣减 {detail.imageCount} 张（任务 #{detail.id}）
                    </div>
                  </section>

                  {/* 子项明细 */}
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        子项明细
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetry}
                        disabled={!hasFailedItems}
                      >
                        <RefreshCw className="h-4 w-4" />
                        重试失败项
                      </Button>
                    </div>

                    {(detail.items ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        暂无子项
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(detail.items ?? []).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-md border border-border p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                #{item.seq}
                              </span>
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              重试次数：{item.retryCount}
                            </div>
                            {item.status === "FAILED" && (
                              <div className="mt-2 space-y-1 text-xs">
                                <div className="text-error">
                                  错误码：
                                  {item.errorCode ?? "—"}
                                </div>
                                <div className="text-error">
                                  错误信息：
                                  {item.errorMsg ?? "—"}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
