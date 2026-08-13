import { apiGet } from "./http";
import type { Style, StyleCategory } from "@/types";

export function listStyles(category?: StyleCategory): Promise<Style[]> {
  return apiGet<Style[]>("/styles", { params: { category } });
}

export function getStyle(id: number): Promise<Style> {
  return apiGet<Style>(`/styles/${id}`);
}
