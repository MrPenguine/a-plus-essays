"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/hooks";

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'expert';
  timestamp: Date;
};

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm here to help you with your project. What can I do for you?",
      sender: 'expert',
      timestamp: new Date(),
    },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          text: message,
          sender: 'user',
          timestamp: new Date(),
        },
      ]);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b dark:border-gray-800">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="/images/expert-avatar.png" />
            <AvatarFallback>EX</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">Expert</h2>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <p>{msg.text}</p>
              <span className="text-xs opacity-70">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t dark:border-gray-800 p-4">
        <div className="flex gap-2">
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <button 
            onClick={handleSend}
            className="p-2 bg-primary hover:bg-primary/90 text-white rounded-full"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}