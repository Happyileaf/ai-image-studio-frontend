import { apiDelete, apiGet, apiPost } from "./http";
import type { GeneratedImageVO, PageQuery, PageResult } from "@/types";

export function listHistoryImages(
  query: PageQuery,
): Promise<PageResult<GeneratedImageVO>> {
  return apiGet<PageResult<GeneratedImageVO>>("/history/images", {
    params: query,
  });
}

export function downloadHistoryImages(ids: number[]): Promise<Blob> {
  return apiGet<Blob>("/history/images/download", {
    params: { ids: ids.join(",") },
    responseType: "blob",
  });
}

export function deleteHistoryImage(id: number): Promise<void> {
  return apiDelete(`/history/images/${id}`);
}

export function batchDeleteHistoryImages(ids: number[]): Promise<void> {
  return apiPost("/history/images/batch-delete", { ids });
}
