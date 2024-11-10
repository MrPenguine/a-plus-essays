import { useState } from 'react';
import { FileUploadSection } from './FileUploadSection';
import { UploadedFile } from '@/lib/types/documents';
import { handleProjectCreation } from '@/lib/firebase/project-service';

interface FormData {
  assignmentType: string;
  projectTitle: string;
  email?: string;
}

export function CreateProject() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState<FormData>({
    assignmentType: '',
    projectTitle: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleProjectCreation({
      ...formData,
      files
    });
    
    if (result.success) {
      // Handle success (e.g., show success message, redirect)
      console.log('Project created successfully');
    } else {
      // Handle error
      console.error('Error creating project:', result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700">
          Project Title
        </label>
        <input
          type="text"
          id="projectTitle"
          name="projectTitle"
          value={formData.projectTitle}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="assignmentType" className="block text-sm font-medium text-gray-700">
          Assignment Type
        </label>
        <select
          id="assignmentType"
          name="assignmentType"
          value={formData.assignmentType}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select type</option>
          <option value="essay">Essay</option>
          <option value="research">Research Paper</option>
          <option value="thesis">Thesis</option>
        </select>
      </div>

      <FileUploadSection 
        files={files}
        setFiles={setFiles}
      />

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Project
      </button>
    </form>
  );
} 