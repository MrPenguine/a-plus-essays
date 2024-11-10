import { auth } from "./config";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { backblazeService } from "../backblaze/file-service";
import { UploadedFile, DocumentStructure, FileData } from "../types/documents";

const uploadFilesToBackblaze = async (files: UploadedFile[], bucketId: string): Promise<FileData[]> => {
  const uploadedFiles: FileData[] = [];
  
  for (const fileData of files) {
    const buffer = await fileData.file.arrayBuffer();
    const result = await backblazeService.uploadFile(
      Buffer.from(buffer),
      fileData.fileName,
      fileData.file.type,
      bucketId
    );
    
    if (result.success && result.fileUrl) {
      uploadedFiles.push({
        fileName: fileData.fileName,
        url: result.fileUrl
      });
    }
  }
  
  return uploadedFiles;
};

export const handleProjectCreation = async (formData: {
  assignmentType: string;
  projectTitle: string;
  email?: string;
  files?: UploadedFile[];
}) => {
  try {
    let currentUser = auth.currentUser;

    if (!currentUser && formData.email) {
      const anonUser = await signInAnonymously(auth);
      currentUser = anonUser.user;
      
      await updateProfile(currentUser, {
        displayName: formData.email,
        photoURL: `mailto:${formData.email}`
      });

      // Upload files if any
      let documentStructure: DocumentStructure = {
        documents: {
          client: [],
          tutor: []
        }
      };

      if (formData.files && formData.files.length > 0) {
        const uploadedFiles = await uploadFilesToBackblaze(
          formData.files,
          process.env.NEXT_PUBLIC_BACKBLAZE_BUCKET_ID || ''
        );

        if (uploadedFiles.length > 0) {
          documentStructure.documents.client.push({
            date: new Date().toISOString().split('T')[0],
            files: uploadedFiles
          });
        }
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          userId: currentUser.uid,
          userEmail: formData.email,
          documents: documentStructure
        })
      });

      const result = await response.json();
      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      user: currentUser
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}; 