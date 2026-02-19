export interface UploadedImageDto {
  path: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  uploadedAt: string;
}
