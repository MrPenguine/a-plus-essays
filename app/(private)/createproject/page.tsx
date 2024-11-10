"use client";

import { CreateProject } from "@/components/CreateProject";
import ClientOnly from "@/components/ClientOnly";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateProjectPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      <ClientOnly>
        <CreateProject />
      </ClientOnly>
    </div>
  );
}
