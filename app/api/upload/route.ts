import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000
};

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

    // Authorization retry logic
    let authData = null;
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const authResponse = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('4b5619123a9b:00594229414c263c08147f0b896fbf895a44bd4f99').toString('base64')
          },
          timeout: 10000 // 10 second timeout
        });

        if (authResponse.status === 200) {
          authData = authResponse.data;
          break;
        }
      } catch (error) {
        console.error(`Authorization attempt ${attempt} failed:`, error);
        if (attempt === RETRY_CONFIG.maxAttempts) {
          throw new Error(`Failed to authorize after ${RETRY_CONFIG.maxAttempts} attempts`);
        }
        await wait(Math.min(RETRY_CONFIG.initialDelay * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelay));
      }
    }

    if (!authData) {
      throw new Error('Failed to get authorization');
    }

    // Use original filename
    const fileName = file.name;

    // Get upload URL with retry logic
    let uploadUrl = null;
    let authorizationToken = null;
    
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const uploadUrlResponse = await axios.post(
          `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
          { bucketId: 'c43bb52631c91152933a091b' },
          {
            headers: {
              'Authorization': authData.authorizationToken
            },
            timeout: 10000
          }
        );

        if (uploadUrlResponse.status === 200) {
          uploadUrl = uploadUrlResponse.data.uploadUrl;
          authorizationToken = uploadUrlResponse.data.authorizationToken;
          break;
        }
      } catch (error) {
        console.error(`Get upload URL attempt ${attempt} failed:`, error);
        if (attempt === RETRY_CONFIG.maxAttempts) {
          throw new Error(`Failed to get upload URL after ${RETRY_CONFIG.maxAttempts} attempts`);
        }
        await wait(Math.min(RETRY_CONFIG.initialDelay * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelay));
      }
    }

    if (!uploadUrl || !authorizationToken) {
      throw new Error('Failed to get upload URL');
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file with retry logic
    let uploadResult = null;
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const uploadResponse = await axios.post(uploadUrl, buffer, {
          headers: {
            'Authorization': authorizationToken,
            'X-Bz-File-Name': fileName,
            'Content-Type': file.type,
            'Content-Length': buffer.length.toString(),
            'X-Bz-Content-Sha1': 'do_not_verify'
          },
          timeout: 30000 // 30 second timeout for upload
        });

        if (uploadResponse.status === 200) {
          uploadResult = uploadResponse.data;
          break;
        }
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        if (attempt === RETRY_CONFIG.maxAttempts) {
          throw new Error(`Failed to upload file after ${RETRY_CONFIG.maxAttempts} attempts`);
        }
        await wait(Math.min(RETRY_CONFIG.initialDelay * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelay));
      }
    }

    if (!uploadResult) {
      throw new Error('Failed to upload file');
    }

    // Construct the file URL
    const fileUrl = `https://f004.backblazeb2.com/file/a-plus-essays/${fileName}`;

    return NextResponse.json({
      success: true,
      fileId: uploadResult.fileId,
      fileName: fileName,
      fileUrl
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