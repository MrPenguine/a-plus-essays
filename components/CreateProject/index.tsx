"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Paperclip, X } from "lucide-react";

interface CreateProjectProps {
  initialData?: {
    assignmentType: string;
    projectTitle: string;
  };
  onClose?: () => void;
}

export default function CreateProject({ initialData, onClose }: CreateProjectProps) {
  const [autoMatch, setAutoMatch] = useState(false);

  // Pre-fill form with initial data if provided
  useEffect(() => {
    if (initialData) {
      // Set your form state here with initialData
    }
  }, [initialData]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-semibold">Create New Project</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Project Title */}
          <div>
            <Label htmlFor="title">Project title*</Label>
            <Input 
              id="title" 
              placeholder="William Shakespeare's short biography"
              className="mt-1.5"
              defaultValue={initialData?.projectTitle}
            />
          </div>

          {/* Brief Description */}
          <div>
            <Label htmlFor="description">Brief description</Label>
            <Textarea 
              id="description" 
              placeholder="I need..."
              className="mt-1.5 min-h-[100px]"
            />
          </div>

          {/* Project Type and Subject Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project type*</Label>
              <Select defaultValue={initialData?.assignmentType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Enter project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="research">Research Paper</SelectItem>
                  <SelectItem value="thesis">Thesis</SelectItem>
                  <SelectItem value="dissertation">Dissertation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject area*</Label>
              <Select>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Enter subject area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="literature">Literature</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="arts">Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attachments and Auto-match */}
          <div className="flex items-center justify-between">
            <Button variant="outline" className="gap-2">
              <Paperclip className="h-4 w-4" />
              Attach
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                checked={autoMatch}
                onCheckedChange={setAutoMatch}
                id="auto-match"
              />
              <Label htmlFor="auto-match" className="text-sm">
                Auto-match
              </Label>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            We will choose the best expert for you
          </div>
        </div>
      </div>

      <div className="p-6 border-t">
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {
            // Handle create logic
            onClose?.();
          }}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
} 