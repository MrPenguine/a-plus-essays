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

interface CreateProjectProps {
  initialData?: {
    assignmentType: string;
    projectTitle: string;
    description?: string;
  };
  onClose?: () => void;
  onSubmit?: () => void;
}

// ... rest of your constants ...

export function CreateProject({ initialData, onClose, onSubmit }: CreateProjectProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countType, setCountType] = useState<'pages' | 'words'>('pages');
  const [formData, setFormData] = useState({
    title: initialData?.projectTitle || '',
    description: initialData?.description || '',
    assignmentType: initialData?.assignmentType || '',
    subject: '',
    educationLevel: 'Undergraduate',
    pages: 1,
    words: 275,
    deadline: '',
    deadlineTime: '12:00',
    files: [] as UploadedFile[]
  });

  // ... rest of your state and handlers ...

  const handleSubmit = async () => {
    if (!formData.title || !formData.assignmentType || !formData.subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // ... your existing upload logic ...

      const orderId = await dbService.createOrder(orderData);
      toast.success("Project created successfully!");

      // Call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit();
      }
      
      // Clean up blob URLs
      formData.files.forEach(file => {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });

      router.push(`/payment-detail?${params.toString()}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component JSX ...
}
