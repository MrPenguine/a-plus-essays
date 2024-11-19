"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Paperclip } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase/config";

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'expert';
  timestamp: Date;
  showActions?: boolean;
  type?: 'subject' | 'educationLevel' | 'countType' | 'wordCount' | 'pageCount' | 'deadline' | 'description' | 'initial';
};

// Add this type for the form data
type ProjectDescriptionForm = {
  description: string;
  files?: File[];
};

// Add this constant at the top with other constants
const WORDS_PER_PAGE = 275;
const PRICE_PER_PAGE = {
  'High School': 8,
  'Undergraduate': 10,
  'Masters': 14,
  'PhD': 15
};

// Add this new function at the top level
async function saveOrder(data: any, files: File[], authToken: string) {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/api/save-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }

  return response.json();
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showTyping, setShowTyping] = useState(false);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [wordCount, setWordCount] = useState(275);
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');
  const [descriptionForm, setDescriptionForm] = useState<ProjectDescriptionForm>({
    description: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize message queue
  useEffect(() => {
    const title = searchParams.get('title');
    const type = searchParams.get('type');

    if (title && type) {
      setMessageQueue([
        {
          id: 1,
          text: `Hi! I'll help you with your ${type}: "${title}".`,
          sender: 'expert',
          timestamp: new Date(),
          type: 'initial'
        },
        {
          id: 2,
          text: "To connect you with the most relevant experts and provide you with the lowest prices, I need to ask you 3 questions. Ok?",
          sender: 'expert',
          timestamp: new Date(),
          showActions: true,
          type: 'initial'
        }
      ]);
    }
  }, [searchParams]);

  // Process message queue
  useEffect(() => {
    if (messageQueue.length > 0 && !showTyping) {
      const nextMessage = messageQueue[0];
      setShowTyping(true);

      setTimeout(() => {
        setShowTyping(false);
        setDisplayedMessages(prev => [...prev, nextMessage]);
        setMessageQueue(prev => prev.slice(1));
        scrollToBottom();
      }, 2000);
    }
  }, [messageQueue, showTyping]);

  const handleGoAhead = () => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    const userResponse: Message = {
      id: Date.now(),
      text: "Go ahead!",
      sender: 'user' as const,
      timestamp: new Date()
    };

    const expertQuestion: Message = {
      id: Date.now() + 1,
      text: "What's the subject area of your project? Pick the right discipline from the list below. 📚\n\nSelect \"Other\" to show your project to every expert. It also will help us find out which subject is missing to add it later on.",
      sender: 'expert' as const,
      timestamp: new Date(),
      showActions: true,
      type: 'subject'
    };

    setDisplayedMessages(prev => [...prev, userResponse]);
    setMessageQueue(prev => [...prev, expertQuestion]);
  };

  const handleSubjectSelect = (subject: string) => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    const userResponse: Message = {
      id: Date.now(),
      text: subject,
      sender: 'user' as const,
      timestamp: new Date()
    };

    const expertQuestion: Message = {
      id: Date.now() + 1,
      text: "What's your level of education? This helps us match you with the right expert.",
      sender: 'expert' as const,
      timestamp: new Date(),
      showActions: true,
      type: 'educationLevel'
    };

    setDisplayedMessages(prev => [...prev, userResponse]);
    setMessageQueue(prev => [...prev, expertQuestion]);
  };

  const handleEducationLevel = (level: string) => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    const userResponse: Message = {
      id: Date.now(),
      text: level,
      sender: 'user' as const,
      timestamp: new Date()
    };

    const expertQuestion: Message = {
      id: Date.now() + 1,
      text: "Would you like to specify the length in pages or words?\n(1 page ≈ 275 words)",
      sender: 'expert' as const,
      timestamp: new Date(),
      showActions: true,
      type: 'countType'
    };

    setDisplayedMessages(prev => [...prev, userResponse]);
    setMessageQueue(prev => [...prev, expertQuestion]);
  };

  const handleCountType = (type: 'pages' | 'words') => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    const userResponse: Message = {
      id: Date.now(),
      text: type === 'pages' ? 'Pages' : 'Words',
      sender: 'user' as const,
      timestamp: new Date()
    };

    const expertQuestion: Message = {
      id: Date.now() + 1,
      text: type === 'pages' 
        ? "How many pages do you need?\nMinimum 1 page (275 words)"
        : "Cool. 😎 How many words do you need?\nAt least 275 words per project.",
      sender: 'expert' as const,
      timestamp: new Date(),
      showActions: true,
      type: type === 'pages' ? 'pageCount' : 'wordCount'
    };

    setDisplayedMessages(prev => [...prev, userResponse]);
    setMessageQueue(prev => [...prev, expertQuestion]);
  };

  const handlePageCount = (count: number) => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    const userResponse: Message = {
      id: Date.now(),
      text: `${count} ${count === 1 ? 'page' : 'pages'} (${count * 275} words)`,
      sender: 'user' as const,
      timestamp: new Date()
    };

    const expertQuestion: Message = {
      id: Date.now() + 1,
      text: "When do you need it? ⏰ Set a deadline for your work a bit prior to the real deadline, in case you'd need to edit some details.",
      sender: 'expert' as const,
      timestamp: new Date(),
      showActions: true,
      type: 'deadline'
    };

    setDisplayedMessages(prev => [...prev, userResponse]);
    setMessageQueue(prev => [...prev, expertQuestion]);
  };

  const handleWordCount = (count: number) => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    // Calculate number of pages from word count
    const pages = Math.ceil(count / WORDS_PER_PAGE);
    
    const userResponse: Message = {
      id: Date.now(),
      text: `${count} words (${pages} ${pages === 1 ? 'page' : 'pages'})`,
      sender: 'user',
      timestamp: new Date()
    };

    const expertQuestion: Message = {
      id: Date.now() + 1,
      text: "When do you need it? ⏰ Set a deadline for your work a bit prior to the real deadline, in case you'd need to edit some details.",
      sender: 'expert',
      timestamp: new Date(),
      showActions: true,
      type: 'deadline'
    };

    setDisplayedMessages(prev => [...prev, userResponse]);
    setMessageQueue(prev => [...prev, expertQuestion]);
  };

  const PageCountInput = ({ onSubmit }: { onSubmit: (count: number) => void }) => {
    const [error, setError] = useState(false);

    const updatePageCount = (newCount: number) => {
      const count = Math.max(1, newCount); // Minimum 1 page
      setPageCount(count);
      setError(count < 1);
    };

    const handleSubmit = () => {
      if (pageCount < 1) {
        toast.error("Minimum is 1 page");
        return;
      }
      onSubmit(pageCount);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => updatePageCount(pageCount - 1)}
            className="h-10 w-10 bg-primary text-white"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="relative flex-1">
            <Input
              type="number"
              value={pageCount}
              onChange={(e) => updatePageCount(parseInt(e.target.value) || 1)}
              className={`text-center ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
              min={1}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => updatePageCount(pageCount + 1)}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500">
            Minimum is 1 page
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={error}
          className="w-full"
        >
          Submit
        </Button>
      </div>
    );
  };

  const WordCountInput = ({ onSubmit }: { onSubmit: (count: number) => void }) => {
    const [error, setError] = useState(false);

    const updateWordCount = (newCount: number) => {
      const count = Math.max(0, newCount);
      setWordCount(count);
      setError(count < 275);
    };

    const handleSubmit = () => {
      if (wordCount < 275) {
        toast.error("Minimum word count is 275");
        return;
      }
      onSubmit(wordCount);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => updateWordCount(wordCount - 1)}
            className="h-10 w-10"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="relative flex-1">
            <Input
              type="number"
              value={wordCount}
              onChange={(e) => updateWordCount(parseInt(e.target.value) || 0)}
              className={`text-center ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
              min={275}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => updateWordCount(wordCount + 1)}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500">
            Minimum word count is 275 words
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={error}
          className="w-full"
        >
          Submit
        </Button>
      </div>
    );
  };

  const DeadlineSelector = ({ onSubmit }: { onSubmit: (date: Date) => void }) => {
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState("12:00");
    const [open, setOpen] = useState(false);

    const handleSubmit = () => {
      if (!date) return;
      
      // Combine date and time
      const [hours, minutes] = time.split(':').map(Number);
      const deadline = new Date(date);
      deadline.setHours(hours, minutes);
      
      onSubmit(deadline);
      setOpen(false);
    };

    return (
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(date, "PPP") + " at " + time
              ) : (
                "Choose your deadline"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-950" align="start">
            <div className="p-3 border-b">
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
            <div className="p-3 border-t">
              <Button 
                className="w-full text-secondary-gray-50"
                onClick={handleSubmit}
                disabled={!date}
              >
                Confirm
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const handleDeadlineSelect = (selectedDate: Date) => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    const userResponse: Message = {
      id: Date.now(),
      text: format(selectedDate, "PPP 'at' p"),
      sender: 'user' as const,
      timestamp: new Date()
    };

    const expertQuestion: Message = {
      id: Date.now() + 1,
      text: "Thanks! Can you describe project briefly?",
      sender: 'expert' as const,
      timestamp: new Date(),
      showActions: true,
      type: 'description'
    };

    setDisplayedMessages(prev => [...prev, userResponse]);
    setMessageQueue(prev => [...prev, expertQuestion]);
  };

  const handleDescriptionSubmit = async () => {
    setShowDescribeModal(false);
    
    // Add user's description as a message
    const userResponse: Message = {
      id: Date.now(),
      text: descriptionForm.description,
      sender: 'user',
      timestamp: new Date()
    };

    const expertResponse: Message = {
      id: Date.now() + 1,
      text: "Great! We're analyzing your project...",
      sender: 'expert',
      timestamp: new Date()
    };

    setDisplayedMessages(prev => [...prev, userResponse, expertResponse]);

    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Please sign in to create a project');
        return;
      }

      const token = await currentUser.getIdToken();

      // Get education level from messages
      const educationLevel = displayedMessages.find(m => 
        m.sender === 'user' && 
        (m.text.includes('School') || m.text.includes('Undergraduate') || m.text.includes('Masters') || m.text.includes('PhD'))
      )?.text || 'Undergraduate';

      // Get pages/words from messages
      const wordMatch = displayedMessages.find(m => 
        m.sender === 'user' && m.text.includes('words'))?.text.match(/(\d+)\s*words/);
      const pageMatch = displayedMessages.find(m => 
        m.sender === 'user' && m.text.includes('page'))?.text.match(/(\d+)\s*page/);

      // Calculate pages
      let pages;
      if (wordMatch) {
        const words = parseInt(wordMatch[1]);
        pages = Math.ceil(words / WORDS_PER_PAGE);
      } else if (pageMatch) {
        pages = parseInt(pageMatch[1]);
      } else {
        pages = 1;
      }

      const orderData = {
        title: searchParams.get('title') || '',
        description: descriptionForm.description,
        assignment_type: searchParams.get('type') || '',
        subject: displayedMessages.find(m => 
          m.sender === 'user' && 
          ['English', 'Business', 'Nursing', 'History', 'Other'].includes(m.text)
        )?.text || 'Other',
        level: educationLevel,
        pages,
        wordcount: pages * WORDS_PER_PAGE,
        deadline: displayedMessages.find(m => 
          m.sender === 'user' && 
          m.text.includes('at')
        )?.text || new Date().toISOString()
      };

      // Get files from description form if any
      const files = descriptionForm.files || [];

      // Save order using API
      const result = await saveOrder(orderData, files, token);

      // Add success message
      const successResponse: Message = {
        id: Date.now() + 2,
        text: "Order saved successfully! Redirecting to choose tutor...",
        sender: 'expert',
        timestamp: new Date()
      };

      setDisplayedMessages(prev => [...prev, successResponse]);

      // Redirect after success
      setTimeout(() => {
        router.push(`/orders/choosetutor?orderId=${result.orderId}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error saving order:', error);
      toast.error(error.message || 'Failed to save order details');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      <div className="flex justify-end p-4 border-b dark:border-gray-800">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {displayedMessages.map((msg) => (
          <div key={msg.id} className="mb-4">
            <div className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'ml-auto text-right' : 'mr-auto'
            }`}>
              {msg.sender === 'expert' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/images/expert-avatar.png" />
                  <AvatarFallback>EX</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`inline-block p-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-primary text-white ml-auto'
                  : 'bg-gray-100 dark:bg-gray-800 text-dark dark:text-white'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div className="text-xs text-gray-500 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {msg.showActions && msg.type === 'initial' && (
              <div className="ml-11 mt-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGoAhead}
                    size="sm"
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    Go ahead!
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/createproject')}
                    size="sm"
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    No, skip it
                  </Button>
                </div>
              </div>
            )}

            {msg.showActions && msg.type === 'subject' && (
              <div className="ml-11 mt-2 grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleSubjectSelect('English')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  English
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleSubjectSelect('Business')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Business
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleSubjectSelect('Nursing')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Nursing
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleSubjectSelect('History')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  History
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleSubjectSelect('Other')}
                  className="bg-primary text-white hover:bg-primary/90 col-span-2"
                >
                  Choose your subject
                </Button>
              </div>
            )}

            {msg.showActions && msg.type === 'educationLevel' && (
              <div className="ml-11 mt-2 grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleEducationLevel('High School')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  High School
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleEducationLevel('Undergraduate')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Undergraduate
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleEducationLevel('Masters')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Masters
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleEducationLevel('PhD')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  PhD
                </Button>
              </div>
            )}

            {msg.showActions && msg.type === 'countType' && (
              <div className="ml-11 mt-2 grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleCountType('pages')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Pages
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleCountType('words')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Words
                </Button>
              </div>
            )}

            {msg.showActions && msg.type === 'pageCount' && (
              <div className="ml-11 mt-2">
                <PageCountInput onSubmit={handlePageCount} />
              </div>
            )}

            {msg.showActions && msg.type === 'wordCount' && (
              <div className="ml-11 mt-2">
                <WordCountInput onSubmit={handleWordCount} />
              </div>
            )}

            {msg.showActions && msg.type === 'deadline' && (
              <div className="ml-11 mt-2">
                <DeadlineSelector onSubmit={handleDeadlineSelect} />
              </div>
            )}

            {msg.showActions && msg.type === 'description' && (
              <div className="ml-11 mt-2">
                <Button 
                  onClick={() => setShowDescribeModal(true)}
                  className="w-full text-secondary-gray-50"
                >
                  Describe project →
                </Button>
              </div>
            )}
          </div>
        ))}

        {showTyping && (
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/images/expert-avatar.png" />
              <AvatarFallback>EX</AvatarFallback>
            </Avatar>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      {/* Description Modal */}
      <Dialog open={showDescribeModal} onOpenChange={setShowDescribeModal}>
        <DialogContent className="sm:max-w-[425px] bg-gray-100 dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Describe your project</DialogTitle>
            <DialogDescription>
              Add details about your project to help us match you with the best expert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe project briefly or attach a file"
              value={descriptionForm.description}
              onChange={(e) => setDescriptionForm(prev => ({
                ...prev,
                description: e.target.value
              }))}
              className="min-h-[150px] bg-background"
            />
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">You will attach additional files later</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDescribeModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleDescriptionSubmit} className="bg-primary text-secondary-gray-50 hover:bg-primary/90">
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}