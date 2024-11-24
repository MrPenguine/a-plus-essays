import { driveService } from './drive-service';

export const googleDriveService = {
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
  ) {
    try {
      const result = await driveService.uploadFile(
        fileBuffer,
        fileName,
        mimeType,
        folderId
      );

      if (!result.success || !result.fileUrl) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        success: true,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileId: result.fileId
      };
    } catch (error) {
      console.error('Error in Google Drive service uploadFile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}; 