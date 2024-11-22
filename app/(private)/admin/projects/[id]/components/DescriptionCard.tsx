import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DescriptionCardProps {
  description: string;
}

export function DescriptionCard({ description }: DescriptionCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Description</h2>
      <div>
        <p className={`text-muted-foreground whitespace-pre-wrap ${
          !showFullDescription ? 'line-clamp-2' : ''
        }`}>
          {description || 'No description provided'}
        </p>
        {description && description.split('\n').length > 2 && (
          <Button
            variant="ghost"
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="mt-2 text-customblue hover:text-lightblue"
          >
            {showFullDescription ? (
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                Show Less <ChevronUp className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                Show More <ChevronDown className="h-4 w-4" />
              </div>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
} 