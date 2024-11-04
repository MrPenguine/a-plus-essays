"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import CreateProject from "@/components/CreateProject";

export default function CreateProjectPage() {
  const searchParams = useSearchParams();
  
  const initialData = {
    projectTitle: searchParams.get('title') || '',
    assignmentType: searchParams.get('type') || '',
  };

  return (
    <div className="pt-[80px] px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
        
        <Card className="p-6">
          <CreateProject initialData={initialData} />
        </Card>
      </div>
    </div>
  );
}
