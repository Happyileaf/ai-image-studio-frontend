export interface GeneratedImage {
  id: number;
  userId: number;
  taskId: number;
  styleId: number;
  styleName: string;
  fileKey: string;
  previewUrl: string;
  width?: number;
  height?: number;
  size?: number;
  createdAt: string;
}

export interface GeneratedImageVO extends GeneratedImage {
  daysLeft: number;
  relativeTime: string;
}
