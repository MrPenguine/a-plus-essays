// @ts-nocheck

import { Card } from "@/components/ui/card";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dbService } from "@/lib/firebase/db-service";

interface DocumentsCardProps {
  documents?: {
    documents?: {
      client?: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
      tutor?: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
    };
  };
  orderId: string;
  onUpdate?: (newDocuments: any) => void;
}

export function DocumentsCard({ documents, orderId, onUpdate }: DocumentsCardProps) {
  const [activeFileTab, setActiveFileTab] = useState<'client' | 'tutor'>('client');
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    const uploadedFiles: { fileName: string; url: string; }[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        uploadedFiles.push({
          fileName: result.fileName,
          url: result.fileUrl
        });
      }

      if (uploadedFiles.length > 0) {
        const currentOrder = await dbService.getOrder(orderId);
        
        const existingDocuments = currentOrder?.documents?.documents || {
          client: [],
          tutor: []
        };

        const newDocumentEntry = {
          date: new Date().toISOString().split('T')[0],
          files: uploadedFiles
        };

        const updatedDocuments = {
          documents: {
            documents: {
              client: existingDocuments.client || [],
              tutor: [
                ...existingDocuments.tutor || [],
                newDocumentEntry
              ]
            }
          }
        };

        await dbService.updateOrder(orderId, updatedDocuments);
        
        if (onUpdate) {
          onUpdate(updatedDocuments);
        }

        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error handling file uploads:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Files</h2>
      <div className="space-y-4">
        {/* File Tabs */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveFileTab('client')}
            className={`pb-2 px-4 ${
              activeFileTab === 'client'
                ? 'border-b-2 border-primary font-medium text-gray-900 dark:text-white'
                : 'text-muted-foreground text-gray-900 dark:text-white'
            }`}
          >
            Client Documents
          </button>
          <button
            onClick={() => setActiveFileTab('tutor')}
            className={`pb-2 px-4 ${
              activeFileTab === 'tutor'
                ? 'border-b-2 border-primary font-medium text-gray-900 dark:text-white'
                : 'text-muted-foreground text-gray-900 dark:text-white'
            }`}
          >
            Tutor Documents
          </button>
        </div>

        {/* Add Document Button - Only for tutor tab */}
        {activeFileTab === 'tutor' && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Add Document
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Upload Document</h4>
                  <p className="text-sm text-muted-foreground">
                    Add tutor documents to this project
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="file">Files</Label>
                  <Input
                    id="file"
                    type="file"
                    multiple
                    className="col-span-3 h-9"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, TXT, RTF, JPG, PNG
                  </p>
                </div>
                {uploading && (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* File Display Area */}
        <div className="min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-secondary-gray-200 dark:border-secondary-gray-700">
          {activeFileTab === 'client' ? (
            documents?.documents?.client?.length ? (
              <div className="space-y-2">
                {documents.documents.client.map((group) => (
                  group.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span>{file.fileName}</span>
                      </a>
                    </div>
                  ))
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No client documents uploaded yet</p>
            )
          ) : (
            documents?.documents?.tutor?.length ? (
              <div className="space-y-2">
                {documents.documents.tutor.map((group) => (
                  group.files.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>{file.fileName}</span>
                    </a>
                  ))
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No tutor documents available yet</p>
            )
          )}
        </div>
      </div>
    </Card>
  );
} 