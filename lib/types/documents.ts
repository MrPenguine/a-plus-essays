export interface FileData {
  fileName: string;
  url: string;
}

export interface DocumentGroup {
  date: string;
  files: FileData[];
}

export interface DocumentStructure {
  documents: {
    client: DocumentGroup[];
    tutor: DocumentGroup[];
  };
}

export interface UploadedFile {
  fileName: string;
  url: string;
  file: File;
} 