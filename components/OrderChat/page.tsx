import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, ArrowLeft } from "lucide-react";
import ably from "@/lib/ably/config";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, arrayUnion, increment, doc } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "react-hot-toast";
import { dbService } from "@/lib/firebase/db-service";

interface OrderChatProps {
  orderid: string;
  onClose: () => void;
  tutorid?: string;
  tutorname?: string;
  profile_pic?: string;
  title?: string;
  chatType: 'active' | 'bidding';
}

interface Message {
  id: string;
  orderid: string;
  messages: Array<{
    message: string;
    sender: string;
    timestamp: string;
  }>;
}

interface ChatOrder {
  id: string;
  title: string;
  tutorid: string;
  tutor_name: string;
  profile_picture: string;
  status: string;
}

// Add this interface for tutor data
interface TutorData {
  tutor_name: string;
  profile_picture: string;
}

export default function OrderChat({ orderid, onClose, tutorid, tutorname, profile_pic, title, chatType }: OrderChatProps) {
  const [showChatList, setShowChatList] = useState(chatType === 'active');
  const [messages, setMessages] = useState<Message['messages']>([]);
  const [activeOrders, setActiveOrders] = useState<ChatOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ChatOrder | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const channel = ably.channels.get(orderid);

  // Add this CSS class at the top level of your component
  const avatarImageStyles = "object-cover w-full h-full";

  // Add state for tutor data
  const [tutorData, setTutorData] = useState<TutorData | null>(null);

  // Add effect to fetch tutor data
  useEffect(() => {
    const fetchTutorData = async (tutorId: string) => {
      try {
        const tutorData = await dbService.getTutorById(tutorId);
        if (tutorData) {
          setTutorData({
            tutor_name: tutorData.tutor_name || 'Expert',
            profile_picture: tutorData.profile_picture || '/default-avatar.png'
          });
        }
      } catch (error) {
        console.error('Error fetching tutor data:', error);
      }
    };

    if (tutorid) {
      fetchTutorData(tutorid);
    }
  }, [tutorid]);

  // Fetch active orders with tutors assigned
  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user || chatType !== 'active') return;

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef, 
          where('userid', '==', user.uid),
          where('tutorid', '!=', ''),
          where('status', 'in', ['pending', 'in_progress'])
        );
        
        const querySnapshot = await getDocs(q);
        const orders: ChatOrder[] = [];
        
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          if (data.tutorid) {
            // Fetch tutor data for each order
            const tutorData = await dbService.getTutorById(data.tutorid);
            orders.push({
              id: doc.id,
              title: data.title.substring(0, 20) + (data.title.length > 20 ? '...' : ''),
              tutorid: data.tutorid,
              tutor_name: tutorData?.tutor_name || 'Expert',
              profile_picture: tutorData?.profile_picture || '/default-avatar.png',
              status: data.status
            });
          }
        }

        setActiveOrders(orders);
      } catch (error) {
        console.error('Error fetching active orders:', error);
      }
    };

    fetchActiveOrders();
  }, [user, chatType]);

  // Modified fetch messages function
  useEffect(() => {
    const fetchMessages = async () => {
      if (!orderid) return;

      try {
        const messagesRef = collection(db, 'messages');
        const q = query(
          messagesRef,
          where('orderid', '==', orderid)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const messageDoc = querySnapshot.docs[0];
          const messageData = messageDoc.data();
          // Sort messages by timestamp
          const sortedMessages = messageData.messages.sort((a: any, b: any) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setMessages(sortedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [orderid]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageData = {
      message: newMessage.trim(),
      sender: user.uid,
      timestamp: new Date().toISOString()
    };

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('orderid', '==', orderid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Create new message document
        await addDoc(messagesRef, {
          orderid,
          messages: [messageData]
        });
      } else {
        // Update existing message document
        const messageDoc = querySnapshot.docs[0];
        await updateDoc(messageDoc.ref, {
          messages: arrayUnion(messageData)
        });
      }

      // Create or update notification for recipient
      const recipientId = selectedOrder?.tutorid || tutorid;
      if (recipientId) {
        const notificationsRef = collection(db, 'notifications');
        const notificationQuery = query(
          notificationsRef,
          where('orderid', '==', orderid),
          where('userid', '==', recipientId)
        );
        
        const notificationSnapshot = await getDocs(notificationQuery);
        
        if (notificationSnapshot.empty) {
          // Create new notification
          await addDoc(notificationsRef, {
            orderid,
            userid: recipientId,
            message: `New message in ${selectedOrder?.title || title}`,
            timestamp: new Date().toISOString(),
            read: false,
            ordertitle: selectedOrder?.title || title,
            unreadCount: 1
          });
        } else {
          // Update existing notification
          const notificationDoc = notificationSnapshot.docs[0];
          await updateDoc(notificationDoc.ref, {
            timestamp: new Date().toISOString(),
            message: `New message in ${selectedOrder?.title || title}`,
            read: false,
            unreadCount: increment(1)
          });
        }
      }

      setNewMessage('');
      const updatedMessages = [...messages, messageData];
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleOrderSelect = (order: ChatOrder) => {
    setSelectedOrder(order);
    setShowChatList(false);
  };

  // Add useEffect to mark messages as read when chat is opened
  useEffect(() => {
    const markNotificationsAsRead = async () => {
      if (!user || !orderid) return;

      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('orderid', '==', orderid),
          where('userid', '==', user.uid),
          where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            read: true,
            unreadCount: 0
          });
        });
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    markNotificationsAsRead();
  }, [user, orderid]);

  // Add this to handle back navigation
  const handleBack = () => {
    setShowChatList(true);
    setSelectedOrder(null);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Chat Panel */}
      <div className="fixed right-4 bottom-4 h-[600px] w-[400px] bg-white dark:bg-gray-900 
        shadow-xl z-50 transition-all duration-300 ease-in-out
        rounded-lg border border-secondary-gray-200 dark:border-secondary-gray-600 
        flex flex-col translate-x-0"
      >
        {chatType === 'active' ? (
          <>
            {showChatList ? (
              <>
                {/* Chat List Header */}
                <div className="p-4 border-b border-secondary-gray-200 dark:border-secondary-gray-600 flex justify-between items-center">
                  <h2 className="font-semibold text-lg">Active Chats</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                  {activeOrders.length > 0 ? (
                    activeOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => handleOrderSelect(order)}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800"
                      >
                        <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                          <AvatarImage 
                            src={order.profile_picture} 
                            alt={order.tutor_name}
                            className={avatarImageStyles}
                            style={{
                              objectFit: 'cover',
                              aspectRatio: '1/1'
                            }}
                          />
                          <AvatarFallback className="bg-primary text-white">
                            {order.tutor_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{order.title}</h3>
                          <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active chats found
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-secondary-gray-200 dark:border-secondary-gray-600 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                    <AvatarImage 
                      src={selectedOrder?.profile_picture || tutorData?.profile_picture || '/default-avatar.png'} 
                      alt={selectedOrder?.tutor_name || tutorData?.tutor_name || 'Expert'}
                      className={avatarImageStyles}
                      style={{
                        objectFit: 'cover',
                        aspectRatio: '1/1'
                      }}
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {(selectedOrder?.tutor_name || tutorData?.tutor_name || 'EX').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold text-dark dark:text-white">
                      {selectedOrder?.tutor_name || tutorData?.tutor_name || 'Expert'}
                    </h2>
                    <p className="text-sm text-dark dark:text-white">Online</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length > 0 ? (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`mb-4 ${
                          msg.sender === user?.uid
                            ? 'ml-auto text-right'
                            : 'mr-auto'
                        }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            msg.sender === user?.uid
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center">
                      No messages yet
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-secondary-gray-200 dark:border-secondary-gray-600 mb-safe">
                  <div className="flex gap-2 items-center">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 h-10"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      className="h-10 w-10 shrink-0"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-gray-500">
            Bidding chat functionality coming soon...
          </div>
        )}
      </div>
    </>
  );
}
