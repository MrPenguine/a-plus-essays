"use client";
import { Star, FileCheck, Check, User, Clock, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/hooks";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateProject from "@/components/CreateProject";
import { handleProjectCreation } from "@/lib/firebase/project-service";
import { toast } from "sonner";

const Hero = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    assignmentType: "",
    projectTitle: "",
    email: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      assignmentType: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.assignmentType || !formData.projectTitle || (!user && !formData.email)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await handleProjectCreation(formData);
      
      if (result.success) {
        // Check if mobile
        if (window.innerWidth < 768) {
          const searchParams = new URLSearchParams({
            title: formData.projectTitle,
            type: formData.assignmentType
          });
          router.push(`/chat?${searchParams.toString()}`);
        } else {
          // Desktop: go to create project page
          const searchParams = new URLSearchParams({
            title: formData.projectTitle,
            type: formData.assignmentType
          });
          router.push(`/createproject?${searchParams.toString()}`);
        }
      } else {
        if (result.redirect) {
          toast.error(result.error || "Failed to process request");
          router.push(result.redirect);
        } else {
          toast.error(result.error || "Failed to process request");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <section className="relative mt-[80px]">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'var(--theme-image, url("/images/hero/hero-light.svg"))',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            opacity: '0.5',
          }}
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      </div>
      

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-16 grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        <h1 className="block lg:hidden text-3xl lg:text-4xl xl:text-6xl font-bold text-foreground">
            A-Plus Homework Help For All
          </h1>
        <div className="w-full max-w-md mx-auto lg:ml-auto order-1 lg:order-2">
          <Card className="bg-card border shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl lg:text-2xl">Get Started</CardTitle>
              <CardDescription>
                Fill in the details to get help with your assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <select
                    name="assignmentType"
                    value={formData.assignmentType}
                    onChange={(e) => handleSelectChange(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="">Select type of assignment</option>
                    <option value="essay">Essay</option>
                    <option value="research">Research Paper</option>
                    <option value="thesis">Thesis</option>
                    <option value="coursework">Coursework</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input 
                    name="projectTitle"
                    placeholder="Enter your project title" 
                    className="bg-background"
                    value={formData.projectTitle}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {!user && (
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-background"
                      required
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground"
                >
                  Get Help Now
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Writers are ready to help you now
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
          <h1 className="hidden lg:block text-3xl lg:text-4xl xl:text-6xl font-bold">
            A-Plus Homework Help For All
          </h1>
          
          <div className="grid grid-cols-3 lg:flex lg:flex-wrap gap-2 lg:gap-4 text-xs lg:text-base">
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <FileCheck className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>AI free content</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <Check className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Plagiarism Free</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <User className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Top Writers</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <Clock className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Money back</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <FileCheck className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Confidential</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <Headphones className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>24/7 Support</span>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-6 bg-background/80 p-2 lg:p-4 rounded-lg shadow-sm border mt-4 lg:mt-0 text-xs lg:text-base">
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-warning text-warning" />
              <span className="font-semibold">4.8</span>
              <span className="text-xs lg:text-sm text-muted-foreground">Review Centre</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-warning text-warning" />
              <span className="font-semibold">4.7</span>
              <span className="text-xs lg:text-sm text-muted-foreground">Sitejabber</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-warning text-warning" />
              <span className="font-semibold">4.7</span>
              <span className="text-xs lg:text-sm text-muted-foreground">Reviews.io</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
