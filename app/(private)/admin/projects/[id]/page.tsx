// @ts-nocheck
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";
import Loading from "@/app/loading";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { X } from "lucide-react";
import { useChatNotifications } from '@/hooks/useChatNotifications';
import AdminChat from "@/app/(private)/admin/components/AdminChat";

// Import components
import { BasicInfoCard } from "./components/BasicInfoCard";
import { UserInfoCard } from "./components/UserInfoCard";
import { AssignmentDetailsCard } from "./components/AssignmentDetailsCard";
import { PaymentDetailsCard } from "./components/PaymentDetailsCard";
import { DocumentsCard } from "./components/DocumentsCard";
import { PaymentsHistoryCard } from "./components/PaymentsHistoryCard";
import { TimelineCard } from "./components/TimelineCard";
import { DescriptionCard } from "./components/DescriptionCard";
import { PaymentReceipt } from "./components/PaymentReceipt";
import { BidChat } from "@/components/admin/adminChat/bid";
import { ActiveChat } from "@/components/admin/adminChat/active";
import { generateReceipt } from "@/lib/utils/generateReceipt";
import { parseISO, format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { TutorAssignmentCard } from "./components/TutorAssignmentCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Types
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
  tutorid?: string;
  amount: number;
  amount_paid: number;
  discountAmount?: number;
  documents?: {
    documents?: {
      client?: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
      tutor?: Array<{
        date: string;
        files: Array<{
          fileName: string;
          url: string;
        }>;
      }>;
    };
  };
}

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
  createdAt: string;
  status?: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [tutorName, setTutorName] = useState<string>('');
  const [receipt, setReceipt] = useState<{ isOpen: boolean; payment: Payment | null }>({
    isOpen: false,
    payment: null
  });
  const [showChat, setShowChat] = useState(false);
  const { chatNotifications } = useChatNotifications();
  const [statusLoading, setStatusLoading] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrderDetails = async () => {
    if (!params.id || !user) return;

    try {
      const token = await user.getIdToken(true);
      const response = await fetch(`/api/admin/fetch-order-details?orderId=${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
      setPayments(data.payments);
      if (data.tutor) {
        setTutorName(data.tutor.tutor_name);
      }
      setTotalPages(Math.ceil(data.payments.length / 10));
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details");
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && user) {
      fetchOrderDetails();
    }
  }, [params.id, mounted, user]);

  const handleDocumentsUpdate = useCallback((newDocuments: any) => {
    setOrder(prev => prev ? { ...prev, ...newDocuments } : null);
  }, []);

  const hasUnreadMessages = (orderId: string) => {
    return chatNotifications[orderId] > 0;
  };

  const handleUpdate = useCallback(async () => {
    await fetchOrderDetails(); // Re-fetch all order details
  }, [fetchOrderDetails]);

  const formatDate = (dateString: string) => {
    try {
      // Try parsing as ISO string
      let date = parseISO(dateString);
      
      // If invalid, try as regular date
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }
      
      // If all parsing attempts fail, return original string
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      if (!order) return;

      const receiptData = {
        orderId: order.id,
        paymentId: payment.paymentId,
        amount: payment.amount,
        date: formatDate(payment.createdAt),
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

  const handleDelete = async () => {
    if (!user || !params.id) return;

    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone and will delete all associated messages and notifications.')) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/delete-order?orderId=${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast.success('Order deleted successfully');
      router.push('/admin/projects/all-projects');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleStatusChange = async () => {
    if (!user || !params.id || !newStatus) return;

    setStatusLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/edit-order?orderId=${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Status updated successfully');
      handleUpdate(); // Refresh order details
      setShowStatusChange(false); // Hide the status change UI
      setNewStatus(''); // Reset selected status
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (!mounted || loading) return <Loading />;
  if (error) return <div className="pt-[80px] px-4"><p className="text-red-500">{error}</p></div>;
  if (!order) return <div className="pt-[80px] px-4"><p>Order not found</p></div>;

  return (
    <div className="pt-[80px] px-2 md:px-4 max-w-[100vw] overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button 
          onClick={() => router.push('/admin/projects/all-projects')}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all projects
        </button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {showStatusChange ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  onClick={handleStatusChange}
                  disabled={!newStatus || statusLoading}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
                >
                  {statusLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    setShowStatusChange(false);
                    setNewStatus('');
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setShowStatusChange(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
            >
              Change Status
            </Button>
          )}

          <Button 
            onClick={handleDelete}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-6"
          >
            Delete Order
          </Button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <BasicInfoCard {...order} />
        <UserInfoCard userid={order.userid} tutorid={order.tutorid} tutorName={tutorName} />
        
        {!order.tutorid && (
          <TutorAssignmentCard 
            orderId={order.id}
            level={order.level}
            pages={order.pages} 
            onUpdate={handleUpdate}
          />
        )}

        <AssignmentDetailsCard {...order} onUpdate={handleUpdate} />
        <PaymentDetailsCard {...order} onUpdate={handleUpdate} />
        <DescriptionCard 
          id={order.id} 
          description={order.description} 
          onUpdate={handleUpdate} 
        />
        <DocumentsCard 
          documents={order.documents} 
          orderId={order.id} 
          onUpdate={handleDocumentsUpdate}
        />
        <PaymentsHistoryCard 
          payments={payments}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onDownloadReceipt={handleDownloadReceipt}
        />
        <TimelineCard createdAt={order.createdAt} updatedAt={order.updatedAt} />
      </div>

      {showChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            {order.tutorid ? (
              <ActiveChat onClose={() => setShowChat(false)} />
            ) : (
              <BidChat onClose={() => setShowChat(false)} />
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setShowChat(true)}
          className="rounded-full h-12 w-12 shadow-lg relative"
        >
          <MessageCircle className="h-6 w-6" />
          {hasUnreadMessages(order.id) && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white">
              {chatNotifications[order.id]}
            </span>
          )}
        </Button>
      </div>

      <Dialog 
        open={receipt.isOpen} 
        onOpenChange={(open) => setReceipt(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="w-full max-w-3xl mx-auto">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receipt.payment && order && (
            <div className="max-h-[80vh] overflow-y-auto">
              <PaymentReceipt payment={receipt.payment} order={order} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
