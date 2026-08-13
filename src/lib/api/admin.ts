import { apiGet, apiPost, apiPut } from "./http";
import type {
  PageQuery,
  PageResult,
  Style,
  Task,
  TaskStatus,
  UserStatus,
  UserVO,
} from "@/types";

export interface DashboardData {
  todayNewUsers: number;
  todayTasks: number;
  todaySuccessRate: number;
  runningTasks: number;
  trend: { date: string; tasks: number; successRate: number }[];
  recentTasks: Task[];
  popularStyles: { style: Style; count: number; percent: number }[];
}

export function listUsers(
  params: { keyword?: string; status?: UserStatus; plan?: string } & PageQuery,
): Promise<PageResult<UserVO>> {
  return apiGet<PageResult<UserVO>>("/admin/users", { params });
}

export function adjustUserQuota(
  id: number,
  dto: { delta: number; reason?: string },
): Promise<void> {
  return apiPut(`/admin/users/${id}/quota`, dto);
}

export function updateUserStatus(id: number, status: UserStatus): Promise<void> {
  return apiPut(`/admin/users/${id}/status`, { status });
}

export function createStyle(dto: Partial<Style>): Promise<Style> {
  return apiPost<Style>("/admin/styles", dto);
}

export function updateStyle(id: number, dto: Partial<Style>): Promise<void> {
  return apiPut(`/admin/styles/${id}`, dto);
}

export function listAdminTasks(
  params: { keyword?: string; status?: TaskStatus; styleId?: number } & PageQuery,
): Promise<PageResult<Task>> {
  return apiGet<PageResult<Task>>("/admin/tasks", { params });
}

export function getDashboard(): Promise<DashboardData> {
  return apiGet<DashboardData>("/admin/dashboard");
}
