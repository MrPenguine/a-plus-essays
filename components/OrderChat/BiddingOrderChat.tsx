"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, increment, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";
import { format } from "date-fns";
import { useChatNotifications } from '@/hooks/useChatNotifications';

interface BiddingOrderChatProps {
  orderId: string;
  title: string;
  onClose: () => void;
}

export function BiddingOrderChat({ orderId, title, onClose }: BiddingOrderChatProps) {
  const [showTutorList, setShowTutorList] = useState(true);
  const [tutors, setTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const { markMessagesAsRead, chatNotifications } = useChatNotifications();

  // ... rest of the bidding chat logic from OrderChat
  // Including tutor list, message handling, etc.

  return (
    // ... bidding chat UI
  );
} 