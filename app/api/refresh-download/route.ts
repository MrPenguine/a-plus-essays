import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { fileName } = await req.json();

    // Get new authorization token
    const authResponse = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('4b5619123a9b:00594229414c263c08147f0b896fbf895a44bd4f99').toString('base64')
      }
    });

    const authData = authResponse.data;

    // Get new download authorization
    const downloadAuthResponse = await axios.post(
      `${authData.apiUrl}/b2api/v2/b2_get_download_authorization`,
      {
        bucketId: 'c43bb52631c91152933a091b',
        fileNamePrefix: '',
        validDurationInSeconds: 604800,
        b2ContentDisposition: `attachment; filename="${fileName}"`
      },
      {
        headers: {
          'Authorization': authData.authorizationToken
        }
      }
    );

    const downloadAuth = downloadAuthResponse.data;

    // Construct new download URL with correct format
    const fileUrl = `${authData.downloadUrl}/file/a-plus-essays/${fileName}?Authorization=${downloadAuth.authorizationToken}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      downloadAuthExpiration: Date.now() + (604800 * 1000)
    });

  } catch (error) {
    console.error('Error refreshing download URL:', error);
    return NextResponse.json(
      { error: 'Failed to refresh download URL' },
      { status: 500 }
    );
  }
} 