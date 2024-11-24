import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/google-drive/file-service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine the appropriate folder ID based on file type
    const folderId = file.type.startsWith('image/') 
      ? process.env.GOOGLE_DRIVE_PROFILE_PICTURES_FOLDER_ID 
      : process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    // Upload to Google Drive
    const result = await googleDriveService.uploadFile(
      buffer,
      file.name,
      file.type,
      folderId
    );

    if (!result.success || !result.fileUrl) {
      throw new Error(result.error || 'Upload failed');
    }

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      fileName: result.fileName,
      fileUrl: result.fileUrl,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to upload file',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 