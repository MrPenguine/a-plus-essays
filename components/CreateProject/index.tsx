"use client";

import { useState } from "react";
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
import { Paperclip, X, CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { dbService } from "@/lib/firebase/db-service";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CreateProjectProps {
  initialData?: {
    assignmentType: string;
    projectTitle: string;
  };
  onClose?: () => void;
}

const EDUCATION_LEVELS = [
  'High School',
  'Undergraduate',
  'Masters',
  'PhD'
];

const SUBJECTS = [
  'English',
  'Business',
  'Nursing',
  'History',
  'Other'
];

// Add these styles to make dropdowns and calendar solid
const selectStyles = "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800";
const calendarStyles = "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800";

export default function CreateProject({ initialData, onClose }: CreateProjectProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [countType, setCountType] = useState<'pages' | 'words'>('pages');
  const [formData, setFormData] = useState({
    title: initialData?.projectTitle || '',
    description: '',
    assignmentType: initialData?.assignmentType || '',
    subject: '',
    educationLevel: 'Undergraduate',
    pages: 1,
    words: 275,
    deadline: '',
    deadlineTime: '12:00',
    files: [] as File[]
  });

  const [showError, setShowError] = useState(false);

  const handleCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    if (countType === 'words') {
      setShowError(count < 275);
      setFormData(prev => ({ ...prev, words: count }));
    } else {
      setFormData(prev => ({ ...prev, pages: Math.max(1, count) }));
    }
  };

  const handleDeadlineSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Format the date and combine with time
    const dateStr = format(date, "yyyy-MM-dd");
    const newDeadline = `${dateStr}T${formData.deadlineTime}:00`; // Add seconds
    
    setFormData(prev => ({ 
      ...prev, 
      deadline: newDeadline
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.assignmentType || !formData.subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const pages = countType === 'pages' ? formData.pages : Math.ceil(formData.words / 275);
      const wordCount = countType === 'words' ? formData.words : formData.pages * 275;

      // Ensure we have a valid date string
      let deadlineStr = formData.deadline;
      if (!deadlineStr) {
        toast.error("Please select a deadline");
        return;
      }

      // Create a valid date object
      const deadlineDate = new Date(deadlineStr);
      if (isNaN(deadlineDate.getTime())) {
        toast.error("Invalid deadline date");
        return;
      }

      // Format the deadline as a simple string
      const formattedDeadline = format(deadlineDate, "yyyy-MM-dd'T'HH:mm:ss");

      const orderData = {
        assignment_type: formData.assignmentType,
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        level: formData.educationLevel,
        pages,
        wordcount: wordCount,
        deadline: formattedDeadline, // Use ISO string format
        file_links: [],
        userid: auth.currentUser?.uid || '',
      };

      const orderId = await dbService.createOrder(orderData);
      toast.success("Project created successfully!");

      const params = new URLSearchParams({
        orderId,
        title: formData.title,
        type: formData.assignmentType,
        level: formData.educationLevel,
        pages: pages.toString(),
        deadline: formattedDeadline // Pass ISO string to URL
      });

      router.push(`/payment-detail?${params.toString()}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Title */}
      <div>
        <Label htmlFor="title">Project title*</Label>
        <Input 
          id="title" 
          placeholder="Project title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1.5"
        />
      </div>

      {/* Project Type */}
      <div>
        <Label>Project type*</Label>
        <Select 
          value={formData.assignmentType}
          onValueChange={(value) => setFormData(prev => ({ ...prev, assignmentType: value }))}
        >
          <SelectTrigger className={`mt-1.5 ${selectStyles}`}>
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent className={selectStyles}>
            <SelectItem value="essay">Essay</SelectItem>
            <SelectItem value="research">Research Paper</SelectItem>
            <SelectItem value="thesis">Thesis</SelectItem>
            <SelectItem value="dissertation">Dissertation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subject Area */}
      <div>
        <Label>Subject area*</Label>
        <Select 
          value={formData.subject}
          onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
        >
          <SelectTrigger className={`mt-1.5 ${selectStyles}`}>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent className={selectStyles}>
            {SUBJECTS.map(subject => (
              <SelectItem key={subject} value={subject.toLowerCase()}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Education Level */}
      <div>
        <Label>Education level*</Label>
        <Select 
          value={formData.educationLevel}
          onValueChange={(value) => setFormData(prev => ({ ...prev, educationLevel: value }))}
        >
          <SelectTrigger className={`mt-1.5 ${selectStyles}`}>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent className={selectStyles}>
            {EDUCATION_LEVELS.map(level => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count Type Selection */}
      <div>
        <Label>Specify length by</Label>
        <Select 
          value={countType}
          onValueChange={(value: 'pages' | 'words') => setCountType(value)}
        >
          <SelectTrigger className={`mt-1.5 ${selectStyles}`}>
            <SelectValue placeholder="Select count type" />
          </SelectTrigger>
          <SelectContent className={selectStyles}>
            <SelectItem value="pages">Pages</SelectItem>
            <SelectItem value="words">Words</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count Input */}
      <div>
        <Label>{countType === 'pages' ? 'Number of pages' : 'Number of words'}*</Label>
        <div className="flex items-center gap-2 mt-1.5">
          <Input 
            type="number"
            min={countType === 'pages' ? 1 : 275}
            value={countType === 'pages' ? formData.pages : formData.words}
            onChange={(e) => handleCountChange(e.target.value)}
            className={showError ? 'border-red-500' : ''}
          />
          {countType === 'pages' && (
            <span className="text-sm text-muted-foreground">
              ({formData.pages * 275} words)
            </span>
          )}
        </div>
        {showError && (
          <p className="text-sm text-red-500 mt-1">
            Minimum word count is 275 words
          </p>
        )}
      </div>

      {/* Deadline */}
      <div>
        <Label>Deadline*</Label>
        <div className="flex gap-2 mt-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.deadline && "text-muted-foreground",
                  selectStyles
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.deadline ? format(new Date(formData.deadline), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-auto p-0 ${calendarStyles}`} align="start">
              <Calendar
                mode="single"
                selected={formData.deadline ? new Date(formData.deadline) : undefined}
                onSelect={handleDeadlineSelect}
                disabled={(date) => date < new Date()}
                initialFocus
                className={calendarStyles}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={formData.deadlineTime}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              deadlineTime: e.target.value,
              deadline: prev.deadline ? `${prev.deadline.split('T')[0]}T${e.target.value}` : ''
            }))}
            className={`w-[150px] ${selectStyles}`}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label>Description</Label>
        <Textarea 
          placeholder="Describe your project"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1.5 min-h-[100px]"
        />
      </div>

      {/* File Attachment */}
      <div>
        <Button variant="outline" className="gap-2">
          <Paperclip className="h-4 w-4" />
          Attach files
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">Up to 15 MB</p>
      </div>

      <div className="flex justify-end gap-4">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={loading || showError}
        >
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </div>
  );
} 