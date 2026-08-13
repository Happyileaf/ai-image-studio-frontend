import { apiPost } from "./http";

export function uploadImage(
  file: File,
): Promise<{ fileKey: string; previewUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPost<{ fileKey: string; previewUrl: string }>("/images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
