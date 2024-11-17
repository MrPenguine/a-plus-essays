import { Metadata } from "next";
import ChatClientPage from "./client-page";
import { SUBJECTS } from "@/lib/constants";
export const metadata: Metadata = {
  title: "Chat - A+ Essays",
  description: "Chat with our experts"
};

async function getInitialData() {
  return {
    welcomeMessage: "Welcome to A+ Essays Chat! How can I help you today?",
    supportedSubjects: [...SUBJECTS],
    educationLevels: [
      'High School',
      'Undergraduate', 
      'Masters',
      'PhD'
    ]
  };
}

export default async function ChatServerPage() {
  const initialData = await getInitialData();
  
  return (
    <div className="min-h-screen bg-background">
      <ChatClientPage initialData={initialData} />
    </div>
  );
} 