"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PRICE_PER_PAGE = {
  'High School': 8,
  'Undergraduate': 10,
  'Masters': 14,
  'PhD': 15
};

export default function PaymentDetailPage() {
  const searchParams = useSearchParams();
  
  // Get all the data from URL params
  const projectData = {
    title: searchParams.get('title'),
    type: searchParams.get('type'),
    subject: searchParams.get('subject'),
    educationLevel: searchParams.get('level'),
    wordCount: searchParams.get('words'),
    deadline: searchParams.get('deadline'),
    description: searchParams.get('description')
  };

  // Calculate number of pages and price
  const calculatePrice = () => {
    const wordsText = projectData.wordCount || '';
    const pageMatch = wordsText.match(/(\d+)\s*pages?/i);
    const wordMatch = wordsText.match(/(\d+)\s*words?/i);
    
    let pages = 1; // Default to 1 page
    
    if (pageMatch) {
      pages = parseInt(pageMatch[1]);
    } else if (wordMatch) {
      pages = Math.ceil(parseInt(wordMatch[1]) / 275);
    }

    const pricePerPage = PRICE_PER_PAGE[projectData.educationLevel as keyof typeof PRICE_PER_PAGE] || 10;
    const totalPrice = pages * pricePerPage;

    return {
      pages,
      pricePerPage,
      totalPrice
    };
  };

  const priceDetails = calculatePrice();

  return (
    <div className="pt-[80px] px-4">
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Project Details</h1>
        
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Project Title</h3>
            <p className="text-lg">{projectData.title}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Assignment Type</h3>
            <p className="text-lg">{projectData.type}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
            <p className="text-lg">{projectData.subject}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Education Level</h3>
            <p className="text-lg">{projectData.educationLevel}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Length</h3>
            <p className="text-lg">{projectData.wordCount}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Deadline</h3>
            <p className="text-lg">{projectData.deadline}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
            <p className="text-lg whitespace-pre-wrap">{projectData.description}</p>
          </div>

          {/* Price Calculation Section */}
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Price Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Number of pages:</span>
                <span className="font-medium">{priceDetails.pages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price per page:</span>
                <span className="font-medium">${priceDetails.pricePerPage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total Price:</span>
                <span className="text-lg font-bold text-primary">
                  ${priceDetails.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="pt-6">
            <Button 
              className="w-full"
              size="lg"
            >
              Proceed to Payment
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
