"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getDashboard, listAdminTasks } from "@/lib/api/admin";
import type { Task, TaskStatus } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------- helpers ---------- */

function formatNumber(n: number): string {
  return n.toLocaleString("zh-CN");
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  return `${day} 天前`;
}

const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  PENDING: { label: "待处理", className: "bg-muted text-muted-foreground" },
  PROCESSING: { label: "处理中", className: "bg-warning/10 text-warning" },
  SUCCESS: { label: "完成", className: "bg-success/10 text-success" },
  FAILED: { label: "失败", className: "bg-error/10 text-error" },
  CANCELED: { label: "已取消", className: "bg-muted text-muted-foreground" },
};

/* ---------- metric card ---------- */

function MetricCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  delta,
  deltaClassName,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
  delta: string;
  deltaClassName: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClassName}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      <div className={`mt-1 text-xs ${deltaClassName}`}>{delta}</div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-20" />
      <Skeleton className="mt-2 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboard,
  });

  const { data: tasksPage, isLoading: tasksLoading } = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: () => listAdminTasks({ page: 1, size: 8 }),
  });

  const tasks = tasksPage?.list ?? [];

  // Trend data + derived values
  const trend = dashboard?.trend ?? [];
  const maxTasks = Math.max(...trend.map((t) => t.tasks), 1);

  // Delta: today vs yesterday
  let tasksDelta = "今日";
  let tasksDeltaClassName = "text-muted-foreground";
  if (trend.length >= 2) {
    const today = trend[trend.length - 1]!.tasks;
    const yesterday = trend[trend.length - 2]!.tasks;
    if (yesterday > 0) {
      const pct = ((today - yesterday) / yesterday) * 100;
      const sign = pct >= 0 ? "+" : "";
      tasksDelta = `${sign}${pct.toFixed(1)}% 较昨日`;
      tasksDeltaClassName = pct >= 0 ? "text-success" : "text-error";
    }
  }

  return (
    <div className="space-y-6">
      {/* ---- metric cards ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardLoading || !dashboard ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              icon={Activity}
              iconClassName="bg-primary/10 text-primary"
              label="今日任务"
              value={formatNumber(dashboard.todayTasks)}
              delta={tasksDelta}
              deltaClassName={tasksDeltaClassName}
            />
            <MetricCard
              icon={Users}
              iconClassName="bg-success/10 text-success"
              label="今日新增用户"
              value={formatNumber(dashboard.todayNewUsers)}
              delta="今日"
              deltaClassName="text-muted-foreground"
            />
            <MetricCard
              icon={TrendingUp}
              iconClassName="bg-info/10 text-info"
              label="今日成功率"
              value={`${dashboard.todaySuccessRate.toFixed(1)}%`}
              delta="今日"
              deltaClassName="text-muted-foreground"
            />
            <MetricCard
              icon={Zap}
              iconClassName="bg-warning/10 text-warning"
              label="运行中任务"
              value={formatNumber(dashboard.runningTasks)}
              delta="实时"
              deltaClassName="text-muted-foreground"
            />
          </>
        )}
      </div>

      {/* ---- trend chart placeholder ---- */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          近 7 天任务趋势
        </h3>
        {dashboardLoading || !dashboard ? (
          <Skeleton className="h-40 w-full" />
        ) : trend.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            暂无趋势数据
          </p>
        ) : (
          <div className="flex h-40 items-end gap-2">
            {trend.map((point, i) => {
              const isToday = i === trend.length - 1;
              const heightPx = Math.round((point.tasks / maxTasks) * 140);
              return (
                <div
                  key={point.date}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded-t ${
                      isToday ? "bg-primary" : "bg-primary/80"
                    }`}
                    style={{ height: `${heightPx}px` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {point.date}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- recent tasks + popular styles ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* recent tasks */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            最近任务
          </h3>
          {tasksLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务编号</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>风格</TableHead>
                  <TableHead>图片数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      暂无任务
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.slice(0, 8).map((task) => {
                    const badge =
                      STATUS_BADGE[task.status] ?? STATUS_BADGE.PENDING;
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-mono text-xs">
                          {task.taskNo}
                        </TableCell>
                        <TableCell>用户 #{task.userId}</TableCell>
                        <TableCell>{task.styleName ?? "-"}</TableCell>
                        <TableCell>{task.imageCount}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRelativeTime(task.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* popular styles */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            热门风格
          </h3>
          {dashboardLoading || !dashboard ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : dashboard.popularStyles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              暂无数据
            </p>
          ) : (
            <div className="space-y-4">
              {dashboard.popularStyles.slice(0, 5).map((item, i) => (
                <div key={item.style.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      i < 3
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {item.style.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(item.count)} 次使用
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {item.percent.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
