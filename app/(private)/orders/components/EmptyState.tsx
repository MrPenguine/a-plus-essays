"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="pt-[80px] px-4">
      <div className="max-w-md mx-auto text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6">
          Get started by creating your first order
        </p>
        <Link href="/createproject">
          <Button>Create New Order</Button>
        </Link>
      </div>
    </div>
  );
} 