"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { useAuth } from "@/lib/firebase/hooks";
import { dbService } from "@/lib/firebase/db-service";
import LoadingState from "./components/LoadingState";
import { Button } from "@/components/ui/button";
import { parse } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface OrderDetail {
  id: string;
  title: string;
  status: string;
  deadline: string;
  pages: number;
  level: string;
  subject: string;
  description: string;
  assignment_type: string;
  wordcount: number;
  userid: string;
  createdAt: string;
  file_links: string[];
  price: number;
  paymentStatus?: string;
  updatedAt?: string;
  documents?: {
    documents: {
      client: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
      tutor: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
    };
  };
}
interface UploadedFile {
  fileName: string;
  url: string;
}

function isValidDate(dateString: string) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function formatDate(dateString: string) {
  if (!isValidDate(dateString)) {
    return 'Invalid Date';
  }
  return format(new Date(dateString), 'PPP');
}

function parseAndValidateDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  
  try {
    // First try parsing as ISO string
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing specific format from the database
    // Example: "November 13th, 2024 at 12:00 PM"
    const match = dateString.match(/^(\w+ \d+(?:st|nd|rd|th)?, \d{4} at \d{1,2}:\d{2} (?:AM|PM))$/);
    if (match) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing date:', error, dateString);
    return null;
  }
}

function formatDeadline(dateString: string | undefined | null): string {
  if (!dateString) return 'No deadline set';
  return dateString; // Return the deadline string exactly as it is in the database
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function parseDeadline(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;

  try {
    // First check if it's in our specific format
    const match = dateString.match(/^([A-Z][a-z]+) (\d+)(?:st|nd|rd|th), (\d{4}) at (\d{1,2}):(\d{2}) ([AP]M)$/);
    if (match) {
      const [_, month, day, year, hour, minute, ampm] = match;
      const timeStr = `${month} ${day}, ${year} ${hour}:${minute} ${ampm}`;
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Fallback to standard date parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch (error) {
    console.error('Error parsing date:', error, dateString);
    return null;
  }
}

function useCountdown(deadlineString: string | undefined | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!deadlineString) return;

    const calculateTimeLeft = () => {
      const deadline = parseDeadline(deadlineString);
      if (!deadline) return;

      const now = new Date();
      if (deadline > now) {
        const days = differenceInDays(deadline, now);
        const hours = differenceInHours(deadline, now) % 24;
        const minutes = differenceInMinutes(deadline, now) % 60;
        const seconds = differenceInSeconds(deadline, now) % 60;
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadlineString]);

  return timeLeft;
}

// Add this helper function at the top of the file
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add this interface for retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

// Add this retry helper function
async function retryOperation<T>(
  operation: () => Promise<T>,
  fileName: string,
  config: RetryConfig = { maxAttempts: 3, baseDelay: 1000, maxDelay: 5000 }
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === config.maxAttempts) break;

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt - 1),
        config.maxDelay
      );

      console.log(`Attempt ${attempt} failed for ${fileName}. Retrying in ${delay}ms...`);
      await wait(delay);
    }
  }

  throw new Error(`Failed to upload ${fileName} after ${config.maxAttempts} attempts: ${lastError?.message}`);
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeFileTab, setActiveFileTab] = useState<'client' | 'tutor'>('client');
  const [mounted, setMounted] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !params.id) return;

      try {
        const orderData = await dbService.getOrder(params.id as string);
        if (orderData.userid !== user.uid) {
          setError("You don't have permission to view this order");
          return;
        }
        setOrder(orderData as OrderDetail);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (user && mounted) {
      fetchOrder();
    }
  }, [params.id, user, mounted]);

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  if (authLoading || loading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="pt-[80px] px-4">
        <p>Please sign in to view order details</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-[80px] px-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-[80px] px-4">
        <p>Order not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Update the handleFileUpload function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    const uploadedFiles: UploadedFile[] = [];
    const failedUploads: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          await retryOperation(
            async () => {
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });

              if (!response.ok) {
                throw new Error(`Upload failed with status ${response.status}`);
              }

              const result = await response.json();
              if (!result.success) {
                throw new Error(result.error || 'Upload failed');
              }

              uploadedFiles.push({
                fileName: result.fileName,
                url: result.fileUrl
              });
            },
            file.name,
            { maxAttempts: 3, baseDelay: 1000, maxDelay: 5000 }
          );
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          failedUploads.push(file.name);
        }
      }

      // Show success message if any files were uploaded
      if (uploadedFiles.length > 0) {
        // Update the order's documents
        const updatedOrder = {
          ...order,
          documents: {
            ...order?.documents,
            documents: {
              ...order?.documents?.documents,
              [activeFileTab]: [
                {
                  date: new Date().toISOString().split('T')[0],
                  files: uploadedFiles
                },
                ...(order?.documents?.documents[activeFileTab] || [])
              ]
            }
          }
        };

        // Update the order in the database
        await dbService.updateOrder(order.id, {
          documents: updatedOrder.documents
        });

        // Update local state
        setOrder(updatedOrder);
        
        if (failedUploads.length === 0) {
          toast.success('All files uploaded successfully');
        } else {
          toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
        }
      }

      // Show error message for failed uploads
      if (failedUploads.length > 0) {
        failedUploads.forEach(fileName => {
          toast.error(`Failed to upload ${fileName}`);
        });
      }
    } catch (error) {
      console.error('Error handling file uploads:', error);
      toast.error('An error occurred while uploading files');
    } finally {
      setUploading(false);
    }
  };

  // Add this function to handle file removal
  const handleRemoveFile = async (groupDate: string, fileIndex: number) => {
    if (!order) return;

    try {
      const updatedOrder = {
        ...order,
        documents: {
          ...order.documents,
          documents: {
            ...order.documents?.documents,
            client: order.documents?.documents.client.map(group => {
              if (group.date === groupDate) {
                return {
                  ...group,
                  files: group.files.filter((_, index) => index !== fileIndex)
                };
              }
              return group;
            }).filter(group => group.files.length > 0) // Remove empty groups
          }
        }
      };

      // Update the order in the database
      await dbService.updateOrder(order.id, {
        documents: updatedOrder.documents
      });

      // Update local state
      setOrder(updatedOrder);
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  return (
    <div className="pt-[80px] relative bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Chat Panel - Slides from right */}
      {showChat && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
            onClick={() => setShowChat(false)}
          />
          
          {/* Chat Panel - Positioned at 25% from top, 75% height */}
          <div 
            className={`
              fixed right-0 h-[75vh] w-80 bg-white dark:bg-gray-900 
              shadow-xl z-50 transition-all duration-300 ease-in-out
              rounded-t-xl top-[25vh]
              ${showChat ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center rounded-t-xl">
              <h2 className="font-semibold">Messages</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex flex-col h-[calc(75vh-65px)]"> {/* Adjust for header height */}
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-sm text-gray-500 text-center">
                  No messages yet
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button size="sm" className="rounded-md">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </button>

        {/* Modified Order Header - With chat button */}
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{order?.title}</h1>
            <Button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 shadow-lg rounded-full px-4 bg-primary hover:bg-primary/90 text-white dark:text-black"
            >
              <span className="text-sm">Open Chat</span>
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground">
              Order #{order?.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Status and Payment Section */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline" className={getStatusColor(order?.status || '')}>
                  {order?.status}
                </Badge>
              </div>
              {order.status === 'pending' && (
                <Button
                  onClick={() => router.push(`/payment-detail?orderId=${order.id}`)}
                  className="bg-primary hover:bg-primary/90 text-white dark:text-black"
                >
                  Proceed to payment
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Assignment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{order?.assignment_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium">{order?.subject}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pages</p>
              <p className="font-medium">{order?.pages}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Words</p>
              <p className="font-medium">{order?.wordcount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="font-medium">{order?.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">${order?.price.toFixed(2)}</p>
            </div>

            {/* Deadline Section - Simplified */}
            <div className="col-span-2 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Deadline</p>
              <p className="font-medium">
                {order.deadline}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <div>
            <p className={`text-muted-foreground whitespace-pre-wrap ${
              !showFullDescription ? 'line-clamp-2' : ''
            }`}>
              {order?.description || 'No description provided'}
            </p>
            {order?.description && order.description.split('\n').length > 2 && (
              <Button
                variant="ghost"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 text-primary hover:text-primary/90"
              >
                {showFullDescription ? (
                  <div className="flex items-center gap-2">
                    Show Less <ChevronUp className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Show More <ChevronDown className="h-4 w-4" />
                  </div>
                )}
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6 mb-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Files</h2>
          <div className="space-y-4">
            {/* File Tabs */}
            <div className="flex gap-4 border-b">
              <button
                onClick={() => setActiveFileTab('client')}
                className={`pb-2 px-4 ${
                  activeFileTab === 'client'
                    ? 'border-b-2 border-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Client Documents
              </button>
              <button
                onClick={() => setActiveFileTab('tutor')}
                className={`pb-2 px-4 ${
                  activeFileTab === 'tutor'
                    ? 'border-b-2 border-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                Tutor Documents
              </button>
            </div>

            {/* Only show Add Document button for client tab */}
            {activeFileTab === 'client' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white dark:text-black">
                    Add Document
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Upload Document</h4>
                      <p className="text-sm text-muted-foreground">
                        Add documents to this project
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="file">Files</Label>
                        <Input
                          id="file"
                          type="file"
                          multiple
                          className="col-span-3 h-9"
                          accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Supported formats: PDF, DOC, DOCX, TXT, RTF, JPG, PNG
                        </p>
                      </div>
                    </div>
                    {uploading && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* File Display Area */}
            <div className="min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {activeFileTab === 'client' ? (
                order?.documents?.documents.client.length > 0 ? (
                  <div className="space-y-2">
                    {order.documents.documents.client.map((group) => (
                      group.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
                        >
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 flex-1"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span>{file.fileName}</span>
                          </a>
                          <button
                            onClick={() => handleRemoveFile(group.date, index)}
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No client documents uploaded yet</p>
                )
              ) : (
                order?.documents?.documents.tutor.length > 0 ? (
                  <div className="space-y-2">
                    {order.documents.documents.tutor.map((group) => (
                      group.files.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>{file.fileName}</span>
                        </a>
                      ))
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No tutor documents available yet</p>
                )
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Timeline</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {order.createdAt}
              </p>
            </div>
            {order.updatedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {order.updatedAt}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}