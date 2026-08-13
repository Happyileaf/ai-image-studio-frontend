export type StyleCategory = "PAINTING" | "PHOTO" | "ART";

export type StyleStatus = 0 | 1; // 0 下架 1 上架

export interface Style {
  id: number;
  name: string;
  category: StyleCategory;
  coverKey?: string;
  coverUrl: string;
  description?: string;
  sortOrder: number;
  status: StyleStatus;
}
