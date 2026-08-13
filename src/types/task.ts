export type TaskStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELED";

export type TaskItemStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELED";

export interface TaskItem {
  id: number;
  taskId: number;
  seq: number;
  status: TaskItemStatus;
  errorCode?: string;
  errorMsg?: string;
  retryCount: number;
}

export interface Task {
  id: number;
  taskNo: string;
  userId: number;
  styleId: number;
  styleName?: string;
  imageCount: number;
  status: TaskStatus;
  successCount: number;
  failCount: number;
  errorMsg?: string;
  createdAt: string;
  finishedAt?: string;
  items?: TaskItem[];
}

// SSE 进度数据结构
export interface TaskProgress {
  status: TaskStatus;
  total: number;
  success: number;
  failed: number;
  currentItem: number;
  stage?: string;
  progress: number;
}

export interface CreateTaskDTO {
  fileKeys: string[];
  styleId: number;
  customPrompt?: string;
}

export interface TaskResultImage {
  id: number;
  seq: number;
  fileKey: string;
  previewUrl: string;
  fileName: string;
}
