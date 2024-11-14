"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, X, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from "date-fns";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PRICE_PER_PAGE } from "@/lib/constants";
import PaystackButton from "@/components/paystack";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { generateReceipt } from "@/lib/utils/generateReceipt";
import Link from 'next/link'
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { SUBJECTS, ASSIGNMENT_TYPES } from "@/lib/constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import OrderChat from "@/components/OrderChat/page";
import { useChatNotifications } from '@/hooks/useChatNotifications';

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
  paymentStatus: 'pending' | 'partial' | 'completed';
  originalPrice: number;
  adjustedPrice?: number;
  additionalPaymentNeeded?: number;
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
  tutorid?: string;
  tutor_name?: string;
  amount: number;
  amount_paid: number;
  discountAmount?: number;
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

function formatDeadline(dateString: string | Date | undefined | null): string {
  if (!dateString) return 'No deadline set';
  
  try {
    let date: Date;
    
    if (typeof dateString === 'string') {
      // First try parsing as a regular date string
      date = new Date(dateString);
      
      // If that fails, try parsing our custom format
      if (isNaN(date.getTime())) {
        const match = dateString.match(/^([A-Z][a-z]+) (\d+)(?:st|nd|rd|th), (\d{4}) at (\d{1,2}):(\d{2}) ([AP]M)$/);
        if (match) {
          const [_, month, day, year, hour, minute, ampm] = match;
          const timeStr = `${month} ${day}, ${year} ${hour}:${minute} ${ampm}`;
          date = new Date(timeStr);
        } else {
          return dateString; // Return original string if we can't parse it
        }
      }
    } else {
      date = dateString;
    }

    // Verify we have a valid date before formatting
    if (isNaN(date.getTime())) {
      return typeof dateString === 'string' ? dateString : 'Invalid date';
    }

    return format(date, "MMMM do, yyyy 'at' h:mm a");
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof dateString === 'string' ? dateString : 'Invalid date';
  }
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

// Add this type for the editable fields
interface EditableFields {
  title: string;
  description: string;
  pages: number;
  subject: string;
  assignment_type: string;
  deadline?: Date;
}




// Add this interface for payment handling
interface PaymentHandlers {
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

const getMinDate = (currentDeadline: string) => {
  const deadline = new Date(currentDeadline);
  const today = new Date();
  return deadline > today ? deadline : today;
};

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
  createdAt: string;
}

interface PaymentReceipt {
  isOpen: boolean;
  payment: Payment | null;
}

// First, let's add the Tutor interface
interface Tutor {
  id: string;
  tutor_name: string;
  bio?: string;
  rating?: number;
  reviews?: string;
  profile_picture?: string;
}

// Add this function at the top level
const getTutorName = async (tutorId: string): Promise<string> => {
  try {
    const tutorsRef = collection(db, 'tutors');
    const q = query(tutorsRef, where('tutorid', '==', tutorId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const tutorDoc = querySnapshot.docs[0];
      const tutorData = tutorDoc.data();
      return tutorData.tutor_name || 'Unknown Tutor';
    }
    return 'Unknown Tutor';
  } catch (error) {
    console.error('Error fetching tutor:', error);
    return 'Error loading tutor';
  }
};

const getTutorProfilePic = async (tutorId: string): Promise<string> => {
  try {
    const tutorsRef = collection(db, 'tutors');
    const q = query(tutorsRef, where('tutorid', '==', tutorId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const tutorDoc = querySnapshot.docs[0];
      const tutorData = tutorDoc.data();
      return tutorData.profile_picture || 'default-avatar.png';
    }
    return 'default-avatar.png';
  } catch (error) {
    console.error('Error fetching tutor profile pic:', error);
    return 'default-avatar.png';
  }
};

// Add these interfaces at the top
interface OrderDetails {
  id: string;
  title: string;
  subject: string;
  level: string;
  pages: number;
  deadline: string;
  assignment_type: string;
  description?: string;
  price: number;
  amount_paid: number;
  discountAmount?: number;
  tutorid?: string;
  tutorId?: string;
  paymentStatus?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeFileTab, setActiveFileTab] = useState<'client' | 'tutor'>('client');
  const [mounted, setMounted] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableFields, setEditableFields] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [receipt, setReceipt] = useState<PaymentReceipt>({
    isOpen: false,
    payment: null
  });
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [tutorName, setTutorName] = useState<string>('');
  const [tutorProfilePic, setTutorProfilePic] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { chatNotifications } = useChatNotifications();

  // Get unread count for this order
  const unreadCount = chatNotifications[params.id as string] || 0;

  // All useEffects should be grouped together
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('openChat') === 'true') {
      setShowChat(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const calculatePrices = () => {
      if (!order) return;

      // Get the total discount amount
      const discount = order.discountAmount || 0;
      setDiscountAmount(discount);

      // Calculate total price
      const total = order.price;
      setTotalPrice(total);

      // Calculate remaining balance considering both paid amount and discount
      const amountPaid = order.amount_paid || 0;
      const effectiveTotalPaid = amountPaid + discount;
      const remaining = Math.max(0, total - effectiveTotalPaid);
      setRemainingBalance(remaining);
    };
    calculatePrices();
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !params.id) return;

      try {
        const orderData = await dbService.getOrder(params.id as string);
        if (orderData.userid !== user.uid) {
          setError("You don't have permission to view this order");
          return;
        }

        // If order has a tutorid, fetch the tutor name
        if (orderData.tutorid) {
          try {
            const tutorData = await dbService.getTutorById(orderData.tutorid);
            if (tutorData) {
              orderData.tutor_name = tutorData.tutor_name;
            }
          } catch (error) {
            console.error('Error fetching tutor:', error);
          }
        }

        setOrder(orderData as OrderDetail);
        
        // Fetch payments...
        try {
          const paymentsData = await dbService.getPayments(params.id as string, user.uid);
          setPayments(paymentsData);
          setTotalPages(Math.ceil(paymentsData.length / 10));
        } catch (error) {
          console.error('Error fetching payments:', error);
          toast.error('Failed to load payments');
        }
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

  useEffect(() => {
    const fetchTutorName = async () => {
      if (order?.tutorid) {
        const name = await getTutorName(order.tutorid);
        setTutorName(name);
      }
    };
    fetchTutorName();
  }, [order?.tutorid]);

  useEffect(() => {
    const fetchTutorProfilePic = async () => {
      if (order?.tutorid) {
        const profilePic = await getTutorProfilePic(order.tutorid);
        setTutorProfilePic(profilePic);
      }
    };
    fetchTutorProfilePic();
  }, [order?.tutorid]);

  // Create PaymentReceipt component outside the main component
  const PaymentReceipt = ({ payment, order }: { payment: Payment; order: OrderDetail }) => {
    return (
      <div className="p-8 max-w-2xl mx-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/favicon.ico"
              alt="A+ Essays"
              width={40}
              height={40}
            />
            <div>
              <h2 className="font-bold text-xl">A+ Essays</h2>
              <p className="text-sm text-gray-600">info@aplusessays.com</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-primary mb-2">PAYMENT RECEIPT</h1>
            <p className="text-sm text-gray-600">Date: {format(new Date(payment.createdAt), "MMMM d, yyyy")}</p>
            <p className="text-sm text-gray-600">Time: {format(new Date(payment.createdAt), "h:mm a")}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-8">
          <p className="text-sm text-gray-600">Order ID: {order.id}</p>
          <p className="text-sm text-gray-600">Payment ID: {payment.paymentId}</p>
        </div>

        {/* Payment Details Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">{order.title}</td>
              <td className="text-right py-2">${payment.amount.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="py-2 font-bold">Total</td>
              <td className="text-right py-2 font-bold">${payment.amount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>Thank you for your business!</p>
          <p>For any queries, please contact support at info@aplusessays.com</p>
        </div>
      </div>
    );
  };

  // THEN your conditional returns
  if (!mounted || authLoading || loading) {
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

  // Event handlers
  const handleViewReceipt = (payment: Payment) => {
    setReceipt({
      isOpen: true,
      payment
    });
  };

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

  const handleEditClick = () => {
    if (!order) return;
    
    let deadline: Date | undefined;
    try {
      if (order.deadline) {
        deadline = new Date(order.deadline);
        if (isNaN(deadline.getTime())) {
          // Try parsing our custom format
          const match = order.deadline.match(/^([A-Z][a-z]+) (\d+)(?:st|nd|rd|th), (\d{4}) at (\d{1,2}):(\d{2}) ([AP]M)$/);
          if (match) {
            const [_, month, day, year, hour, minute, ampm] = match;
            const timeStr = `${month} ${day}, ${year} ${hour}:${minute} ${ampm}`;
            deadline = new Date(timeStr);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing deadline:', error);
    }
    
    setEditableFields({
      title: order.title,
      description: order.description,
      pages: order.pages,
      subject: order.subject,
      assignment_type: order.assignment_type,
      deadline: deadline
    });
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!order || !editableFields) return;
    setSaving(true);

    try {
      // Calculate new price if pages changed
      let newPrice = order.price;
      if (editableFields.pages !== order.pages) {
        const pricePerPage = PRICE_PER_PAGE[order.level as keyof typeof PRICE_PER_PAGE] || 10;
        newPrice = editableFields.pages * pricePerPage;
      }

      const additionalPaymentNeeded = Math.max(0, newPrice - order.originalPrice);

      // Update order in database
      await dbService.updateOrder(order.id, {
        title: editableFields.title,
        description: editableFields.description,
        pages: editableFields.pages,
        subject: editableFields.subject,
        assignment_type: editableFields.assignment_type,
        wordcount: editableFields.pages * 275,
        price: newPrice,
        adjustedPrice: newPrice,
        additionalPaymentNeeded,
        paymentStatus: additionalPaymentNeeded > 0 ? 'partial' : order.paymentStatus,
        deadline: editableFields.deadline ? format(editableFields.deadline, "MMMM do, yyyy 'at' h:mm a") : order.deadline
      });

      // Fetch updated order
      const updatedOrder = await dbService.getOrder(order.id);
      setOrder(updatedOrder as OrderDetail);
      setIsEditing(false);
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      const receiptData = {
        orderId: order.id,
        paymentId: payment.paymentId,
        amount: payment.amount,
        date: format(new Date(payment.createdAt), "MMMM d, yyyy h:mm a"),
        orderTitle: order.title,
        orderDetails: {
          subject: order.subject,
          type: order.assignment_type,
          pages: order.pages
        }
      };

      const pdfBlob = await generateReceipt(receiptData);
      const url = URL.createObjectURL(pdfBlob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  // Add this helper function
  const calculateRemainingBalance = (order: OrderDetail) => {
    const amountPaid = order.amount_paid || 0;
    const discount = order.discountAmount || 0;
    const effectiveTotalPaid = amountPaid + discount;
    return Math.max(0, order.price - effectiveTotalPaid);
  };

  // Update the shouldShowPaymentButton function
  const shouldShowPaymentButton = () => {
    if (!order) return false;
    if (!order.tutorid) return false;
    
    const amountPaid = order.amount_paid || 0;
    const discount = order.discountAmount || 0;
    const effectiveTotalPaid = amountPaid + discount;
    
    return effectiveTotalPaid < order.price;
  };

  return (
    <div className="pt-[80px] relative bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center gap-2 z-50"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 flex items-center justify-center">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          </div>
        )}
      </button>

      {/* Chat Component */}
      {showChat && (
        <OrderChat 
          orderid={params.id as string} 
          onClose={() => setShowChat(false)} 
          tutorid={order?.tutorid || ''} 
          tutorname={tutorName || ''}
          profile_pic={tutorProfilePic || 'default-avatar.png'}
          title={order?.title}
          chatType={order?.tutorid ? 'active' : 'bidding'}
        />
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </button>

        {/* Modified Order Header - With chat button and notification badge */}
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{order?.title}</h1>
            <div className="relative">
              <Button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 shadow-lg rounded-full px-4 bg-primary hover:bg-primary/90 text-white"
              >
                <span className="text-sm font-primary text-white">Open Chat</span>
                <MessageCircle className="h-5 w-5 text-white" />
              </Button>
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 flex items-center justify-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
                    {unreadCount}
                  </span>
                </div>
              )}
            </div>
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
              <div className="flex items-center gap-2">
                {order && calculateRemainingBalance(order) > 0 && (
                  <div className="flex flex-col items-end">
                    <p className="text-sm text-muted-foreground">Remaining Balance:</p>
                    <p className="font-medium text-primary">
                      ${calculateRemainingBalance(order).toFixed(2)}
                    </p>
                    <Button
                      onClick={() => router.push(`/payment-detail?orderId=${order.id}`)}
                      className="bg-customblue hover:bg-lightblue text-white text-sm hover:bg-opacity-90 hover:border-lightblue"
                    >
                      Complete Payment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 bg-white dark:bg-gray-950">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Assignment Details</h2>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-white dark:text-black"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              {isEditing ? (
                <select
                  value={editableFields?.assignment_type}
                  onChange={(e) => setEditableFields(prev => ({
                    ...prev!,
                    assignment_type: e.target.value
                  }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ASSIGNMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-medium">{order?.assignment_type}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              {isEditing ? (
                <select
                  value={editableFields?.subject}
                  onChange={(e) => setEditableFields(prev => ({
                    ...prev!,
                    subject: e.target.value
                  }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-medium">{order?.subject}</p>
              )}
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
              <p className="text-sm text-muted-foreground">Tutor</p>
              {order?.tutorid ? (
                <p className="font-medium">{tutorName || 'Loading...'}</p>
              ) : (
                <Link 
                  href={`/orders/choosetutor?orderId=${params.id}`}
                  className="inline-flex items-center px-3 py-1 text-sm bg-primary hover:bg-primary/90 text-white dark:text-black rounded-md transition-colors"
                >
                  Assign Tutor
                </Link>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              {order?.tutorid ? (
                <p className="font-medium">
                  ${isEditing ? 
                    ((editableFields?.pages || 0) * (PRICE_PER_PAGE[order.level as keyof typeof PRICE_PER_PAGE] || 10)).toFixed(2) 
                    : order?.price.toFixed(2)}
                </p>
              ) : (
                <p className="font-medium text-muted-foreground">
                  Choose a tutor first
                </p>
              )}
            </div>

            {/* Deadline Section */}
            <div className="col-span-2 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Deadline</p>
                  <p className="font-medium">
                    {isEditing && editableFields?.deadline 
                      ? formatDeadline(editableFields.deadline)
                      : formatDeadline(order.deadline)}
                  </p>
                </div>
                {isEditing && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        Extend Deadline
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 bg-white dark:bg-gray-950 border border-border shadow-lg"
                      align="end"
                    >
                      <div className="p-3 border-b border-border">
                        <h4 className="font-medium">Extend Deadline</h4>
                      </div>
                      <Calendar
                        mode="single"
                        selected={editableFields?.deadline}
                        onSelect={(date) => date && setEditableFields(prev => ({
                          ...prev!,
                          deadline: date
                        }))}
                        disabled={(date) => {
                          const minDate = getMinDate(order.deadline);
                          return date < minDate;
                        }}
                        initialFocus
                        className="rounded-t-none"
                      />
                      <div className="p-3 border-t border-border bg-white dark:bg-gray-950">
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
                          value={editableFields?.deadline?.getHours() || 12}
                          onChange={(e) => {
                            const newDate = new Date(editableFields?.deadline || new Date());
                            newDate.setHours(parseInt(e.target.value));
                            setEditableFields(prev => ({
                              ...prev!,
                              deadline: newDate
                            }));
                          }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i-12} PM` : `${i} AM`}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={editableFields?.deadline?.getMinutes() || 0}
                          onChange={(e) => {
                            const newDate = new Date(editableFields?.deadline || new Date());
                            newDate.setMinutes(parseInt(e.target.value));
                            setEditableFields(prev => ({
                              ...prev!,
                              deadline: newDate
                            }));
                          }}
                        >
                          {['00', '15', '30', '45'].map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {minutes} minutes
                            </option>
                          ))}
                        </select>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 bg-white dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <div>
            {isEditing ? (
              <Textarea
                value={editableFields?.description}
                onChange={(e) => setEditableFields(prev => ({
                  ...prev!,
                  description: e.target.value
                }))}
                className="min-h-[100px]"
              />
            ) : (
              <>
                <p className={`text-muted-foreground whitespace-pre-wrap ${
                  !showFullDescription ? 'line-clamp-2' : ''
                }`}>
                  {order?.description || 'No description provided'}
                </p>
                {order?.description && order.description.split('\n').length > 2 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-customblue hover:text-lightblue"
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
              </>
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
                order?.documents?.documents?.client?.length ? (
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
                order?.documents?.documents?.tutor?.length ? (
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

        <Card className="mt-6 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payments</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments
                  .slice((currentPage - 1) * 10, currentPage * 10)
                  .map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.createdAt), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>{payment.paymentId}</TableCell>
                      <TableCell className="text-right">
                        ${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={payment.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(payment)}
                        >
                          Download Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {payments.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No payments found
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="py-2 px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Receipt Dialog */}
        <Dialog 
          open={receipt.isOpen} 
          onOpenChange={(open) => setReceipt(prev => ({ ...prev, isOpen: open }))}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            {receipt.payment && order && (
              <PaymentReceipt payment={receipt.payment} order={order} />
            )}
          </DialogContent>
        </Dialog>

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
