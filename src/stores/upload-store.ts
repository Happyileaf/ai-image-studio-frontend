"use client";
import { create } from "zustand";

export interface UploadedFile {
  id: string;            // 本地唯一 id（用 crypto.randomUUID() 或 Date.now+随机）
  file: File;
  fileKey?: string;      // 上传成功后的临时 key
  previewUrl: string;    // 本地预览 URL 或预签名 URL
  status: "uploading" | "done" | "error";
  error?: string;
}

interface UploadState {
  files: UploadedFile[];
  addFiles: (files: File[]) => string[];   // 返回被接受的文件本地 id（受 1~9 上限约束，超过 9 截断）
  removeFile: (id: string) => void;
  markUploaded: (id: string, fileKey: string, previewUrl: string) => void;
  markError: (id: string, error: string) => void;
  clear: () => void;
  canAddMore: () => boolean;
  count: () => number;
}

const MAX_FILES = 9;

export const useUploadStore = create<UploadState>()((set, get) => ({
  files: [],
  addFiles: (incoming) => {
    const current = get().files;
    const remaining = MAX_FILES - current.length;
    if (remaining <= 0) return [];
    const accepted = incoming.slice(0, remaining);
    const newOnes: UploadedFile[] = accepted.map((file) => ({
      id: (crypto?.randomUUID?.() ?? `f-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));
    set({ files: [...current, ...newOnes] });
    return newOnes.map((f) => f.id);
  },
  removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
  markUploaded: (id, fileKey, previewUrl) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, fileKey, previewUrl, status: "done" } : f)),
    })),
  markError: (id, error) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, status: "error", error } : f)),
    })),
  clear: () => set({ files: [] }),
  canAddMore: () => get().files.length < MAX_FILES,
  count: () => get().files.length,
}));
