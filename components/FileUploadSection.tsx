"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { UploadedFile } from '@/lib/types/documents';
import { backblazeService } from '@/lib/backblaze/file-service';

interface FileUploadSectionProps {
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
}

export function FileUploadSection({ files, setFiles }: FileUploadSectionProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(e.target.files)) {
      try {
        // Create a temporary URL for preview
        const tempUrl = URL.createObjectURL(file);
        newFiles.push({
          fileName: file.name,
          url: tempUrl,
          file: file
        });
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    setFiles([...files, ...newFiles]);
    setUploading(false);
    
    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    // Revoke the temporary URL to prevent memory leaks
    URL.revokeObjectURL(newFiles[index].url);
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {uploading ? 'Uploading...' : 'Attach Files'}
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="truncate max-w-[200px]">{file.fileName}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 