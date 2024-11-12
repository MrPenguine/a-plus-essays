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
import { UploadedFile } from '@/lib/types/documents';
import { backblazeService } from '@/lib/backblaze/file-service';
import { ASSIGNMENT_TYPES, SUBJECTS } from '@/lib/constants';

interface CreateProjectProps {
  initialData?: {
    assignmentType: string;
    projectTitle: string;
  };
  onClose?: () => void;
  onSubmit?: () => void;
}

const EDUCATION_LEVELS = [
  'High School',
  'Undergraduate',
  'Masters',
  'PhD'
];


// Add these styles to make dropdowns and calendar solid
const selectStyles = "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800";
const calendarStyles = "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800";

// Add this constant at the top of the file
const BACKBLAZE_PUBLIC_URL = 'https://f005.backblazeb2.com/file/a-plus-essays';

export function CreateProject({ initialData, onClose, onSubmit }: CreateProjectProps) {
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
    files: [] as UploadedFile[]
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'image/jpeg',
      'image/png'
    ];

    const files = Array.from(e.target.files)
      .filter(file => {
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large (max 15MB)`);
          return false;
        }
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} has unsupported format`);
          return false;
        }
        return true;
      })
      .map(file => ({
        file,
        fileName: file.name,
        url: URL.createObjectURL(file)
      }));

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
    
    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFormData(prev => {
      const newFiles = [...prev.files];
      // Revoke the temporary URL to prevent memory leaks
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return { ...prev, files: newFiles };
    });
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Create order data from form state
      const orderData = {
        title: formData.title,
        description: formData.description,
        assignment_type: formData.assignmentType,
        subject: formData.subject,
        level: formData.educationLevel,
        pages: countType === 'pages' ? formData.pages : Math.ceil(formData.words / 275),
        wordcount: countType === 'pages' ? formData.pages * 275 : formData.words,
        deadline: formData.deadline,
        file_links: [],
        userid: auth.currentUser?.uid,
        status: 'pending' as const,  // Type assertion to match Order interface
        paymentStatus: 'pending' as const,
        amount_paid: 0
      };

      const orderId = await dbService.createOrder(orderData);
      
      if (orderId) {
        toast.success('Project created successfully');
        router.push(`/orders/${orderId}/choosetutor`);
      }
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
            {ASSIGNMENT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
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
          placeholder="Describe your project requirements in detail..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            description: e.target.value 
          }))}
          className="mt-1.5 min-h-[100px] resize-y"
        />
      </div>

      {/* File Attachment */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Paperclip className="h-4 w-4" />
            Attach files
          </label>
          <p className="text-xs text-muted-foreground">Up to 15 MB</p>
        </div>
        {formData.files.length > 0 && (
          <div className="space-y-2">
            {formData.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="truncate max-w-[200px]">{file.fileName}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
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