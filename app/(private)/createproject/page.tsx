"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Paperclip, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [autoMatch, setAutoMatch] = useState(false);
  const [formData, setFormData] = useState({
    projectTitle: searchParams.get('title') || '',
    assignmentType: searchParams.get('type') || '',
    description: '',
    subjectArea: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    router.push('/chat');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-start justify-center px-4 pt-8 pb-8">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Create New Project</h1>
        </div>

        <Card className="p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <Label htmlFor="title">Project title*</Label>
              <Input 
                id="title" 
                placeholder="William Shakespeare's short biography"
                className="mt-1.5"
                value={formData.projectTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
                required
              />
            </div>

            {/* Brief Description */}
            <div>
              <Label htmlFor="description">Brief description</Label>
              <Textarea 
                id="description" 
                placeholder="I need..."
                className="mt-1.5 min-h-[120px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Project Type and Subject Area */}
            <div className="space-y-4">
              <div>
                <Label>Project type*</Label>
                <select
                  className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.assignmentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value }))}
                  required
                >
                  <option value="">Select project type</option>
                  <option value="essay">Essay</option>
                  <option value="research">Research Paper</option>
                  <option value="thesis">Thesis</option>
                  <option value="dissertation">Dissertation</option>
                </select>
              </div>

              <div>
                <Label>Subject area*</Label>
                <select
                  className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.subjectArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectArea: e.target.value }))}
                  required
                >
                  <option value="">Select subject area</option>
                  <option value="literature">Literature</option>
                  <option value="history">History</option>
                  <option value="science">Science</option>
                  <option value="arts">Arts</option>
                </select>
              </div>
            </div>

            {/* Attachments and Auto-match */}
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" className="gap-2">
                <Paperclip className="h-4 w-4" />
                Attach files
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

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">
                Create Project
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
