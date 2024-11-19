import B2 from 'backblaze-b2';

// Initialize B2 client
const b2 = new B2({
  applicationKeyId: '4b5619123a9b',
  applicationKey: '00594229414c263c08147f0b896fbf895a44bd4f99'
});

let authorized = false;

export const getAuthorizedB2 = async () => {
  if (!authorized) {
    try {
      await b2.authorize();
      authorized = true;
      console.log('B2 client authorized successfully');
    } catch (error) {
      console.error('Error authorizing Backblaze B2:', error);
      return null;
    }
  }
  return b2;
};

export const uploadFile = async (
  bucketId: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ success: boolean; fileId?: string; fileName?: string; fileUrl?: string; error?: string }> => {
  try {
    const b2Client = await getAuthorizedB2();
    if (!b2Client) {
      throw new Error('B2 client not initialized');
    }
    
    // Generate a unique filename to prevent collisions
    const uniqueFileName = `${Date.now()}-${fileName}`;
    
    console.log('Uploading file:', uniqueFileName);
    
    const { data: { uploadUrl, authorizationToken } } = await b2Client.getUploadUrl({
      bucketId: 'c43bb52631c91152933a091b'
    });

    console.log('Got upload URL:', uploadUrl);

    const response = await b2Client.uploadFile({
      uploadUrl: uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: uniqueFileName,
      data: fileBuffer,
      contentType: contentType
    });

    console.log('Upload response:', response);

    // Wait for file to be available and get download URL
    const fileUrl = await new Promise<string>((resolve, reject) => {
      const checkAvailability = async () => {
        try {
          const downloadResponse = await b2Client.downloadFileByName({
            bucketName: 'a-plus-essays',
            fileName: uniqueFileName,
            responseType: 'arraybuffer'
          });
          
          if (downloadResponse) {
            resolve(`https://f004.backblazeb2.com/file/a-plus-essays/${uniqueFileName}`);
          } else {
            setTimeout(checkAvailability, 1000); // Retry after 1 second
          }
        } catch (err) {
          setTimeout(checkAvailability, 1000); // Retry after 1 second
        }
      };
      checkAvailability();
    });

    return { 
      success: true, 
      fileId: response.data.fileId,
      fileName: uniqueFileName,
      fileUrl
    };
  } catch (error) {
    console.error('Error uploading file to Backblaze B2:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

export const downloadFile = async (
  bucketName: string,
  fileName: string
) => {
  try {
    const b2Client = await getAuthorizedB2();
    if (!b2Client) {
      throw new Error('B2 client not initialized');
    }
    
    const response = await b2Client.downloadFileByName({
      bucketName: bucketName,
      fileName: fileName,
      responseType: 'arraybuffer'
    });

    return response.data;
  } catch (error) {
    console.error('Error downloading file from Backblaze B2:', error);
    throw error;
  }
};