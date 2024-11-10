declare module 'backblaze-b2' {
  interface B2Options {
    applicationKeyId: string;
    applicationKey: string;
  }

  interface UploadUrlResponse {
    data: {
      uploadUrl: string;
      authorizationToken: string;
    };
  }

  interface UploadFileOptions {
    uploadUrl: string;
    uploadAuthToken: string;
    fileName: string;
    data: Buffer;
    contentType: string;
  }

  interface DownloadFileOptions {
    bucketName: string;
    fileName: string;
    responseType: string;
  }

  interface B2Response {
    data: any;
  }

  class B2 {
    constructor(options: B2Options);
    authorize(): Promise<void>;
    getUploadUrl(options: { bucketId: string }): Promise<UploadUrlResponse>;
    uploadFile(options: UploadFileOptions): Promise<B2Response>;
    downloadFileByName(options: DownloadFileOptions): Promise<B2Response>;
  }

  export default B2;
} 