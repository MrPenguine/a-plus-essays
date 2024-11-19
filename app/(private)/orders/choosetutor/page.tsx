"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { TutorCard } from "./components/TutorCard";
import { ProjectDetailsCard } from "./components/ProjectDetailsCard";
import { InviteFriendsCard } from "./components/InviteFriendsCard";
import { useEffect, useState } from "react";
import { dbService } from "@/lib/firebase/db-service";
import { toast } from "sonner";
import Link from "next/link";

// Update the tutor interface to match database fields
interface Tutor {
  tutorid: string;
  tutor_name: string;
  bio: string;
  rating: number;
  reviews: string;
  highschool_cpp: number;
  undergraduate_cpp: number;
  masters_cpp: number;
  phd_cpp: number;
  mentor: boolean;
  profile_picture?: string;
  education?: string;
  orders_completed: number;
}

interface TransformedTutor {
  name: string;
  rating: number;
  reviews: number;
  education: string;
  bio: string;
  completedProjects: number;
  totalProjects: number;
  subject: string;
  price: number;
  costPerPage: number;
  isMentor: boolean;
  badges: string[];
  profilePicture?: string;
  id: string;
  isTopRated?: boolean;
}

export default function ChooseTutorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [tutors, setTutors] = useState<TransformedTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const fetchTutorsAndOrder = async () => {
      if (!orderId) return;

      try {
        const order = await dbService.getOrder(orderId);
        setOrderDetails(order);

        if (order.tutorid) {
          router.push(`/payment-detail?orderId=${orderId}`);
          return;
        }

        const tutorsData = await dbService.getTutors();
        
        const transformedTutors = tutorsData.map((tutor: Tutor) => {
          // Get the correct cpp based on order level
          const getCostPerPage = () => {
            const level = order.level?.toLowerCase();
            switch (level) {
              case 'high school':
                return tutor.highschool_cpp;
              case 'undergraduate':
                return tutor.undergraduate_cpp;
              case 'masters':
                return tutor.masters_cpp;
              case 'phd':
                return tutor.phd_cpp;
              default:
                return tutor.undergraduate_cpp;
            }
          };

          const costPerPage = getCostPerPage();
          const totalPages = order.pages || 1;
          const totalPrice = costPerPage * totalPages; // Total price for all pages
          
          return {
            id: tutor.tutorid,
            name: tutor.tutor_name,
            rating: tutor.rating || 4.5,
            reviews: parseInt(tutor.reviews) || 0,
            education: tutor.education || "Higher Education",
            bio: tutor.bio || "No bio available",
            completedProjects: Math.floor((tutor.orders_completed || 0) / 5),
            totalProjects: tutor.orders_completed || 0,
            subject: order.subject || "General",
            price: totalPrice, // Show total price in large text
            costPerPage: costPerPage, // Show cost per page in small text
            isMentor: tutor.mentor || false,
            badges: ["AI free"],
            profilePicture: tutor.profile_picture || '/images/placeholder-avatar.jpg',
            isTopRated: false
          };
        });

        // Sort tutors by rating and mentor status
        const sortedTutors = transformedTutors.sort((a, b) => {
          if (a.isMentor && !b.isMentor) return -1;
          if (!a.isMentor && b.isMentor) return 1;
          return b.rating - a.rating;
        });

        // Mark the first tutor as top rated
        if (sortedTutors.length > 0) {
          sortedTutors[0].isTopRated = true;
        }

        setTutors(sortedTutors);
      } catch (error) {
        console.error('Error fetching tutors:', error);
        toast.error('Failed to load tutors');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorsAndOrder();
  }, [orderId, router]);

  if (!orderId) {
    return (
      <div className="pt-[80px] px-4">
        <Card className="pt-[80px] px-4">
          <p className="text-center text-red-500">No order ID provided</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-[80px] px-4">
      <div className="max-w-6xl mx-auto py-4 sm:py-8">
        <button 
          onClick={() => router.push(`/orders/${orderId}`)}
          className="flex items-center gap-2 mb-4 sm:mb-6 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to order
        </button>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content - Tutor List */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
           
              <h1 className="text-xl sm:text-2xl text-gray-700 dark:text-secondary-gray-50 font-bold mb-2 sm:mb-4">Choose an expert for your project</h1>
              <Link href={`/orders/${orderId}`}>
                <p className="text-muted-foreground mb-2">
                  Order #{orderId.slice(0, 8)}
                </p>
              </Link>
            

            {/* Loading State */}
            {loading ? (
              <div className="space-y-4 sm:space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 sm:p-6">
                    <div className="animate-pulse flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full mx-auto sm:mx-0" />
                      <div className="flex-1 space-y-3 sm:space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Tutor Cards */
              <div className="space-y-4 sm:space-y-6">
                {tutors.map((tutor) => (
                  <TutorCard 
                    key={tutor.id} 
                    tutor={tutor} 
                    orderId={orderId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <ProjectDetailsCard order={orderDetails} />
            <InviteFriendsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
