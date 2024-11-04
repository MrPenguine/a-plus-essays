"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingState() {
  return (
    <div className="pt-[80px] px-4">
      <div className="max-w-6xl mx-auto py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 