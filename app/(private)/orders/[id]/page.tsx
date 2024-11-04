"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, X } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { useAuth } from "@/lib/firebase/hooks";
import { dbService } from "@/lib/firebase/db-service";
import LoadingState from "./components/LoadingState";
import { Button } from "@/components/ui/button";
import { parse } from "date-fns";

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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeFileTab, setActiveFileTab] = useState<'client' | 'tutor'>('client');
  const timeLeft = useCountdown(order?.deadline || '');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !params.id) return;

      try {
        const orderData = await dbService.getOrder(params.id as string);
        
        // Type assertion to match the interface
        const typedOrderData = orderData as OrderDetail;
        
        // Check if the order belongs to the current user
        if (typedOrderData.userid !== user.uid) {
          setError("You don't have permission to view this order");
          return;
        }

        setOrder(typedOrderData);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    }
  }, [params.id, user]);

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

        {/* Order Header with Chat Button */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{order?.title}</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowChat(true)}
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full px-4"
                >
                  <span className="text-sm">Open Chat</span>
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Badge variant="outline" className={getStatusColor(order?.status || '')}>
                  {order?.status}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Order #{order?.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Order Details Cards - Rest remains the same */}
        <div className="space-y-6">
          <Card className="p-6">
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

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {order?.description}
            </p>
          </Card>

          <Card className="p-6">
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

              {/* File Display Area */}
              <div className="min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {activeFileTab === 'client' ? (
                  order?.file_links && order.file_links.length > 0 ? (
                    <div className="space-y-2">
                      {order.file_links.map((file, index) => (
                        <a
                          key={index}
                          href={file}
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
                          <span>Client Document {index + 1}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No client documents uploaded yet</p>
                  )
                ) : (
                  <p className="text-center text-muted-foreground">No tutor documents available yet</p>
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

      {/* Fixed Chat Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6">
        <Button
          onClick={() => setShowChat(true)}
          className="flex items-center gap-2 shadow-lg rounded-full px-4 bg-primary hover:bg-primary/90"
        >
          <span className="text-sm text-white">Open Chat</span>
          <MessageCircle className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
}
