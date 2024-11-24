export interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  mimeType: string;
  createdTime: string;
}

export interface UploadFileResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileId?: string;
  error?: string;
}

export interface CreateFolderResult {
  success: boolean;
  folderId?: string;
  error?: string;
} 