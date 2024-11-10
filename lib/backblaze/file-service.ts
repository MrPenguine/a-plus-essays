import { uploadFile as uploadFileToB2 } from './config';

export const backblazeService = {
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    bucketId: string
  ) {
    try {
      const result = await uploadFileToB2(
        bucketId,
        fileName,
        fileBuffer,
        contentType
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
      console.error('Error in backblaze service uploadFile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}; 