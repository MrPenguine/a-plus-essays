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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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

  if (!mounted || loading) return <Loading />;
  if (error) return <div className="pt-[80px] px-4"><p className="text-red-500">{error}</p></div>;
  if (!order) return <div className="pt-[80px] px-4"><p>Order not found</p></div>;

  return (
    <div className="pt-[80px] px-4">
      <button 
        onClick={() => router.push('/admin/projects/all-projects')}
        className="flex items-center gap-2 mb-6 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all projects
      </button>

      <BasicInfoCard {...order} />
      <UserInfoCard userid={order.userid} tutorid={order.tutorid} tutorName={tutorName} />
      <AssignmentDetailsCard {...order} />
      <PaymentDetailsCard {...order} />
      <DescriptionCard description={order.description} />
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
      />
      <TimelineCard createdAt={order.createdAt} updatedAt={order.updatedAt} />

      {showChat && (
        order.tutorid ? (
          <ActiveChat onClose={() => setShowChat(false)} />
        ) : (
          <BidChat onClose={() => setShowChat(false)} />
        )
      )}

      <div className="fixed bottom-6 right-6">
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receipt.payment && order && (
            <PaymentReceipt payment={receipt.payment} order={order} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
