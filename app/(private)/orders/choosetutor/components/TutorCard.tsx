import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { dbService } from "@/lib/firebase/db-service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TutorCardProps {
  tutor: {
    id: string;
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
    discountedPrice?: number;
    isMentor?: boolean;
    badges?: string[];
    profilePicture?: string;
    isTopRated?: boolean;
  };
  orderId: string;
}

export function TutorCard({ tutor, orderId }: TutorCardProps) {
  const router = useRouter();

  const handleHireExpert = async () => {
    try {
      const price = typeof tutor.price === 'number' ? tutor.price : 0;
      
      await dbService.updateOrder(orderId, {
        tutorid: tutor.id,
        price: price,
        status: 'pending'
      });

      toast.success('Expert assigned successfully');
      
      router.push(`/payment-detail?orderId=${orderId}`);
    } catch (error) {
      console.error('Error hiring expert:', error);
      toast.error('Failed to hire expert. Please try again.');
    }
  };

  return (
    <Card className={cn(
      "p-6 relative",
      tutor.isTopRated && "border-2 border-yellow-500"
    )}>
      {tutor.isTopRated && (
        <div className="absolute -top-3 right-4 bg-yellow-500 text-white px-2 py-1 text-xs font-medium rounded">
          BEST OFFER
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Section */}
        <div className="relative mx-auto sm:mx-0">
          <div className="w-32 h-32 relative rounded-full overflow-hidden bg-gray-100">
            <Image
              src={tutor.profilePicture || '/images/placeholder-avatar.jpg'}
              alt={tutor.name}
              fill
              className="object-cover"
            />
          </div>
          {tutor.isMentor && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className="bg-blue-500 text-white">AI free</Badge>
            </div>
          )}
        </div>

        {/* Tutor Info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h3 className="text-xl font-semibold mb-1">{tutor.name}</h3>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {tutor.rating} ({tutor.reviews} reviews)
                </span>
              </div>
            </div>
            <div className="text-center sm:text-right mb-4 sm:mb-0">
              <p className="text-2xl font-bold text-primary"><span className="text-sm">price </span>${tutor.price}</p>
              <p className="text-sm text-muted-foreground">
                Pay now only ${tutor.price/2}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <p className="text-sm mb-4">{tutor.bio}</p>
              <p className="text-sm text-muted-foreground">
                Completed {tutor.completedProjects} projects related to {tutor.subject} out of {tutor.totalProjects} projects
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:w-[200px]">
              <Button 
                onClick={handleHireExpert}
                className="w-full bg-customblue hover:bg-lightblue text-white text-sm hover:bg-opacity-90 hover:border-lightblue"
              >
                HIRE THIS EXPERT
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-customblue text-customblue"
              >
                CHAT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 