"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/firebase/hooks";
import Image from "next/image";
import { useState, useEffect } from "react";

// Sample project stats
const projectStats = [
  { id: 1, label: "All", count: 0 },
  { id: 2, label: "At the auction", count: 0 },
  { id: 3, label: "In progress", count: 0 },
  { id: 4, label: "Under warranty", count: 0 },
  { id: 5, label: "Completed", count: 0 },
  { id: 6, label: "In draft", count: 0 },
];

export default function DashboardContent() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pt-[80px]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr,1fr] gap-8">
          {/* Left Column - Main Content */}
          <Card className="">
            <div className="space-y-8">
              <Card className="relative overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src="/images/blog/blog-04.png"
                  alt="Background"
                  fill
                  className="object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-600/50" />
              </div>

              {/* Content */}
              <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-white">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Who'll complete your study project?
                  </h2>
                  <p className="text-white/90 text-lg mb-6">
                    4399 top experts are online and ready to help you right now.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <Button 
                      size="lg" 
                      className="w-fit bg-white text-blue-600 hover:bg-white/90"
                    >
                      Find an Expert
                    </Button>
                    <p className="text-sm text-white/80">— it's free</p>
                  </div>
                </div>

                {/* You can add an illustration here if needed */}
                <div className="hidden md:block w-1/3">
                  <Image
                    src="/images/about/about-light-02.svg"
                    alt="Experts illustration"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </Card>

            <div className="p-6 mt-8">
              <h3 className="text-lg font-medium mb-6">It's So Easy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Create your project</h4>
                  <p className="text-sm text-muted-foreground">Tell us about the project and your requirements.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Pick an expert</h4>
                  <p className="text-sm text-muted-foreground">Compare offers from top experts and pick the best one.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Track progress</h4>
                  <p className="text-sm text-muted-foreground">Chat with your expert, get drafts, and discuss all the details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Enjoy your project done</h4>
                  <p className="text-sm text-muted-foreground">Set a deadline to get your project completed on time.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Feel safe</h4>
                  <p className="text-sm text-muted-foreground">Make any edits if necessary for free during a warranty period.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">AI free</h4>
                  <p className="text-sm text-muted-foreground">Our experts do not use AI in completing projects.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center mt-8 p-6">
              
              <Button size="lg">Create a Project</Button>
              </div>
            </div>
          </Card>

          {/* Right Column - User Profile & Stats */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.email || ''} />
                  <AvatarFallback className="text-lg">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">
                  {user?.displayName || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {user?.email}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Profile
                </Button>
              </div>
            </Card>

            {/* Projects Stats Card */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">My projects</h3>
              <div className="space-y-2">
                {projectStats.map((stat) => (
                  <div 
                    key={stat.id} 
                    className="flex items-center justify-between py-2 hover:bg-muted/50 rounded px-2 cursor-pointer"
                  >
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                    <span className="text-sm font-medium">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 