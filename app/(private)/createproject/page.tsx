"use client";

import { useSearchParams } from "next/navigation";
import { CreateProject } from "@/components/CreateProject/";

export default function CreateProjectPage() {
  const searchParams = useSearchParams();
  
  const initialData = {
    projectTitle: searchParams.get('title') || '',
    assignmentType: searchParams.get('type') || '',
  };

  return (
    <div className="container mx-auto">
      <div className="pt-[100px] px-4 md:px-8 lg:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Project
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Fill in the details below to create your new project
            </p>
          </div>
          <CreateProject initialData={initialData} />
        </div>
      </div>
    </div>
  );
}