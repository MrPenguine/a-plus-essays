"use client";

import CreateProject from "@/components/CreateProject/index";

export default function CreateProjectPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      <CreateProject />
    </div>
  );
}
