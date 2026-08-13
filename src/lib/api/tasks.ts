import { apiGet, apiPost } from "./http";
import type { CreateTaskDTO, Task, TaskResultImage, TaskStatus } from "@/types";

export function createTask(
  dto: CreateTaskDTO,
): Promise<{ taskId: number; taskNo: string; status: TaskStatus }> {
  return apiPost("/tasks", dto);
}

export function getCurrentTask(): Promise<Task | null> {
  return apiGet<Task | null>("/tasks/current");
}

export function getTask(id: number): Promise<Task> {
  return apiGet<Task>(`/tasks/${id}`);
}

export function cancelTask(id: number): Promise<void> {
  return apiPost(`/tasks/${id}/cancel`);
}

export function retryTask(id: number): Promise<void> {
  return apiPost(`/tasks/${id}/retry`);
}

export function getTaskResults(id: number): Promise<TaskResultImage[]> {
  return apiGet<TaskResultImage[]>(`/tasks/${id}/results`);
}

export function downloadTaskResults(id: number): Promise<Blob> {
  return apiGet<Blob>(`/tasks/${id}/download`, { responseType: "blob" });
}
