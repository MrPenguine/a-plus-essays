import { drive } from './config';
import { Readable } from 'stream';
import { GaxiosResponse } from 'gaxios';
import { drive_v3 } from 'googleapis';

interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  error?: string;
}

export const driveService = {
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
  ): Promise<UploadResult> {
    try {
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);

      const fileMetadata: drive_v3.Schema$File = {
        name: `${Date.now()}-${fileName}`,
        parents: folderId ? [folderId] : [process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!]
      };

      const media = {
        mimeType: mimeType,
        body: bufferStream
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      if (!response.data.id) {
        throw new Error('Failed to get file ID from upload response');
      }

      // Set file permissions to "anyone with link can view"
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
          allowFileDiscovery: false
        }
      });

      // Get the updated file with webViewLink
      const file = await drive.files.get({
        fileId: response.data.id,
        fields: 'id, name, webViewLink'
      });

      return {
        success: true,
        fileId: file.data.id || undefined,
        fileName: file.data.name || undefined,
        fileUrl: file.data.webViewLink || undefined
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      return false;
    }
  },

  async createFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id'
      });

      return response.data.id || null;
    } catch (error) {
      console.error('Error creating folder in Google Drive:', error);
      return null;
    }
  },

  async listFiles(folderId?: string) {
    try {
      const response = await drive.files.list({
        q: folderId ? `'${folderId}' in parents` : undefined,
        fields: 'files(id, name, webViewLink, mimeType, createdTime)',
        orderBy: 'createdTime desc'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }
}; 