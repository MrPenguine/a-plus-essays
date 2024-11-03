"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Paperclip } from "lucide-react";

export default function CreateProject() {
  const [autoMatch, setAutoMatch] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Project</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Title */}
          <div>
            <Label htmlFor="title">Project title*</Label>
            <Input 
              id="title" 
              placeholder="William Shakespeare's short biography"
              className="mt-1.5"
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
              <Select>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline">Back</Button>
            <Button>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 