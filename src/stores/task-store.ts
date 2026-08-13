"use client";
import { create } from "zustand";
import type { TaskProgress, TaskResultImage } from "@/types";

type WorkspacePhase = "idle" | "processing" | "result";

interface TaskState {
  phase: WorkspacePhase;
  taskId: number | null;
  progress: TaskProgress | null;
  results: TaskResultImage[];
  styleName?: string;
  startProcessing: (taskId: number, styleName?: string) => void;
  setProgress: (p: TaskProgress) => void;
  finishProcessing: (results: TaskResultImage[]) => void;
  reset: () => void;
}

const initial = { phase: "idle" as WorkspacePhase, taskId: null, progress: null, results: [] as TaskResultImage[], styleName: undefined };

export const useTaskStore = create<TaskState>()((set) => ({
  ...initial,
  startProcessing: (taskId, styleName) =>
    set({ phase: "processing", taskId, styleName, progress: { status: "PROCESSING", total: 0, success: 0, failed: 0, currentItem: 0, progress: 0 }, results: [] }),
  setProgress: (p) => set({ progress: p }),
  finishProcessing: (results) => set({ phase: "result", progress: { status: "SUCCESS", total: results.length, success: results.length, failed: 0, currentItem: results.length, progress: 100 }, results }),
  reset: () => set(initial),
}));
