"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, MessageCircle, Paperclip, Pencil, CalendarIcon } from "lucide-react";
import { dbService } from "@/lib/firebase/db-service";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ASSIGNMENT_TYPES, SUBJECTS } from '@/lib/constants';
import { 
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem 
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Add this helper function
const getCppFieldName = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'high school':
      return 'highschool_cpp';
    case 'undergraduate':
      return 'undergraduate_cpp';
    case 'masters':
      return 'masters_cpp';
    case 'phd':
      return 'phd_cpp';
    default:
      return 'undergraduate_cpp';
  }
};

// Dynamically import InviteFriends component
const InviteFriends = dynamic(() => import('@/components/InviteFriends'), {
  loading: () => (
    <Card className="p-4">
      <div className="h-[200px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </Card>
  ),
  ssr: false
});

interface TutorData {
  id: string;
  tutor_name: string;
  profile_picture: string;
  rating: number;
  reviews: string;
  bio: string;
  highschool_cpp: number;
  undergraduate_cpp: number;
  masters_cpp: number;
  phd_cpp: number;
  tutorid: string;
  mentor: boolean;
}

interface OrderDetails {
  id: string;
  title: string;
  subject: string;
  assignment_type: string;
  deadline: string;
  wordcount: number;
  level: string;
  tutorid?: string;
  pages: number;
}

// Add this helper function to get the price key based on education level
const getPriceKey = (level: string): keyof TutorData => {
  switch (level.toLowerCase()) {
    case 'high school':
      return 'highschool_cpp';
    case 'undergraduate':
      return 'undergraduate_cpp';
    case 'masters':
      return 'masters_cpp';
    case 'phd':
      return 'phd_cpp';
    default:
      return 'undergraduate_cpp'; // fallback to undergraduate if level is unknown
  }
};

// Add this helper function to generate a random number between min and max
const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Update the calculateCompletedProjects function
const calculateCompletedProjects = (reviews: string, subject: string, isMentor: boolean): number => {
  // For mentors, return a random number between 100 and 150 for the specific subject
  if (isMentor) {
    return getRandomNumber(100, 150);
  }
  
  // For non-mentors, return a random number between 50 and 99
  return getRandomNumber(50, 99);
};

// Add these styles at the top of the file
const selectStyles = "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800";

export default function ChooseTutorPage() {
  const params = useParams();
  const router = useRouter();
  const [sortBy, setSortBy] = useState("most_relevant");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [tutors, setTutors] = useState<TutorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editableFields, setEditableFields] = useState<{
    subject: string;
    assignment_type: string;
    deadline: string;
  } | null>(null);

  // Fetch order details and tutors
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      try {
        // Fetch order details
        const orderData = await dbService.getOrder(params.id as string);
        setOrder(orderData as OrderDetails);

        // Only redirect to payment if tutor is assigned AND price is set
        if (orderData.tutorId && orderData.price) {
          router.push(`/payment-detail?orderId=${params.id}`);
          return;
        }

        // Fetch tutors
        const tutorsData = await dbService.getTutors();
        setTutors(tutorsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  // Update the price calculation in handleHireTutor
  const handleHireTutor = async (tutor: TutorData) => {
    if (!order) return;
    
    try {
      // Get the correct price key based on education level
      const priceKey = getPriceKey(order.level);
      const pricePerPage = tutor[priceKey];
      
      // Calculate total price (pages * price per page)
      const totalPrice = order.pages * pricePerPage;

      // Update order with tutor ID and price
      await dbService.updateOrder(order.id, {
        tutorId: tutor.tutorid,
        price: totalPrice,
        status: 'tutor_assigned'
      });

      // Redirect to payment page
      router.push(`/payment-detail?orderId=${order.id}`);
    } catch (error) {
      console.error("Error hiring tutor:", error);
      toast.error("Failed to hire tutor");
    }
  };

  // Update the price display in the tutor card
  const getTutorPrice = (tutor: TutorData, order: OrderDetails | null) => {
    if (!order) return 0;
    const priceKey = getPriceKey(order.level);
    return tutor[priceKey];
  };

  // Update the sort function to use the correct price
  const getSortedTutors = () => {
    if (!order) return tutors;
    
    const priceKey = getPriceKey(order.level);
    
    return [...tutors].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "price_low":
          return a[priceKey] - b[priceKey];
        case "price_high":
          return b[priceKey] - a[priceKey];
        default:
          return b.rating * parseInt(b.reviews) - a.rating * parseInt(a.reviews);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleEditClick = () => {
    if (!order) return;
    
    setEditableFields({
      subject: order.subject,
      assignment_type: order.assignment_type,
      deadline: order.deadline,
    });
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!order || !editableFields) return;

    try {
      await dbService.updateOrder(order.id, {
        subject: editableFields.subject,
        assignment_type: editableFields.assignment_type,
        deadline: editableFields.deadline,
      });

      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        ...editableFields
      } : null);
      
      setIsEditing(false);
      toast.success("Project details updated successfully");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project details");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] mt-[80px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-[80px] min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="flex-grow order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">Choose an expert for your project</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={cn(
                  "border rounded-md px-2 py-1 w-full sm:w-auto",
                  selectStyles
                )}
              >
                <option value="most_relevant">Most relevant</option>
                <option value="rating">Rating</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Tutors List */}
          <div className="space-y-4">
            {getSortedTutors().map((tutor) => (
              <Card key={tutor.id} className="p-4 sm:p-6 bg-white dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Tutor Avatar Section */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                    <Avatar className="h-16 w-16 sm:h-24 sm:w-24 relative">
                      <AvatarImage 
                        src={tutor.profile_picture} 
                        alt={tutor.tutor_name}
                        className="object-cover"
                      />
                      <AvatarFallback>{tutor.tutor_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-row sm:flex-col gap-2 sm:mt-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full text-center">
                        AI free
                      </span>
                      {tutor.mentor && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full text-center cursor-help">
                                MENTOR
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Expert tutor with more than 100 completed orders</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  {/* Tutor Info Section */}
                  <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h2 className="text-lg font-semibold">{tutor.tutor_name}</h2>
                          {tutor.mentor && (
                            <Badge 
                              variant="secondary"
                              className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900"
                            >
                              MENTOR
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(tutor.rating)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm">
                            {tutor.rating} ({tutor.reviews} reviews)
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {tutor.bio}
                        </p>
                        <p className="text-sm">
                          Completed {calculateCompletedProjects(tutor.reviews, order?.subject || '', tutor.mentor)} {order?.subject} projects
                        </p>
                      </div>

                      {/* Price Section */}
                      <div className="text-left sm:text-right">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Price per page</p>
                          <p className="text-2xl font-bold">
                            ${order ? getTutorPrice(tutor, order) : 0}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total: ${order ? (getTutorPrice(tutor, order) * order.pages) : 0}
                            <span className="block text-xs">
                              ({order?.pages || 0} pages × {order?.pages ? order.pages * 275 : 0} words)
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            className="w-full bg-[#15171c] hover:bg-[#15171c]/90 text-white"
                            onClick={() => handleHireTutor(tutor)}
                          >
                            HIRE THIS EXPERT
                          </Button>
                          <Button variant="outline" className="w-full">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            CHAT
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[300px] order-1 lg:order-2">
          {/* Project Details Card */}
          <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Project details</h2>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className="h-8 px-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 px-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    className="h-8 px-2"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Subject Area</Label>
                {isEditing ? (
                  <Select
                    value={editableFields?.subject}
                    onValueChange={(value) => setEditableFields(prev => ({
                      ...prev!,
                      subject: value
                    }))}
                  >
                    <SelectTrigger className={cn("mt-1", selectStyles)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={selectStyles}>
                      {SUBJECTS.map(subject => (
                        <SelectItem key={subject} value={subject.toLowerCase()}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{order?.subject}</p>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Project Type</Label>
                {isEditing ? (
                  <Select
                    value={editableFields?.assignment_type}
                    onValueChange={(value) => setEditableFields(prev => ({
                      ...prev!,
                      assignment_type: value
                    }))}
                  >
                    <SelectTrigger className={cn("mt-1", selectStyles)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={selectStyles}>
                      {ASSIGNMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{order?.assignment_type}</p>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Deadline</Label>
                {isEditing ? (
                  <div className="mt-1 space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left text-sm">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editableFields?.deadline || "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editableFields?.deadline ? new Date(editableFields.deadline) : undefined}
                          onSelect={(date) => date && setEditableFields(prev => ({
                            ...prev!,
                            deadline: format(date, "PPP")
                          }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <p className="text-sm">{order?.deadline}</p>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Number of words</Label>
                <p className="text-sm">{order?.wordcount}</p>
              </div>
            </div>
          </Card>

          {/* Invite Friends Card */}
          <InviteFriends />
        </div>
      </div>
    </div>
  );
} 