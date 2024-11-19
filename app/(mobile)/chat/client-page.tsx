"use client";

import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'expert';
  timestamp: Date;
  showActions?: boolean;
  type?: 'subject' | 'educationLevel' | 'countType' | 'wordCount' | 'pageCount' | 'deadline' | 'description' | 'initial';
  className?: string;
}

interface ChatClientPageProps {
  initialData: {
    welcomeMessage: string;
    supportedSubjects: string[];
    educationLevels: string[];
  };
}

export default function ChatClientPage({ initialData }: ChatClientPageProps) {
  const [showTyping, setShowTyping] = useState(false);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setMessageQueue([
        {
          id: 1,
          text: initialData.welcomeMessage,
          sender: 'expert',
          timestamp: new Date(),
          type: 'initial',
          showActions: true
        }
      ]);
    }
  }, [initialData]);

  useEffect(() => {
    if (messageQueue.length > 0 && !showTyping) {
      const nextMessage = messageQueue[0];
      setShowTyping(true);

      const timer = setTimeout(() => {
        setShowTyping(false);
        setDisplayedMessages(prev => [...prev, nextMessage]);
        setMessageQueue(prev => prev.slice(1));
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [messageQueue, showTyping]);

  const handleGoAhead = () => {
    setDisplayedMessages(prev => prev.map(msg => ({ ...msg, showActions: false })));
    
    const userResponse: Message = {
      id: Date.now(),
      text: "Go ahead!",
      sender: 'user' as const,
      timestamp: new Date(),
      className: 'text-secondary-gray-50'
    };

    setMessageQueue(prev => [...prev, userResponse]);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      <div className="flex-1 overflow-y-auto p-4">
        {displayedMessages.map((msg) => (
          <div key={msg.id} className="space-y-2 mb-4">
            <div className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              {msg.sender === 'expert' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/images/expert-avatar.png" />
                  <AvatarFallback>EX</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === 'user'
                  ? 'bg-primary text-secondary-gray-50'
                  : 'bg-muted'
              }`}>
                <p className={`whitespace-pre-wrap ${msg.className || ''}`}>{msg.text}</p>
              </div>
            </div>
          </div>
        ))}

        {showTyping && (
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/images/expert-avatar.png" />
              <AvatarFallback>EX</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3">
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
    </div>
  );
} 