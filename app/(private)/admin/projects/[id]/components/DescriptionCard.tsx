"use client"

import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";

interface DescriptionCardProps {
  id: string;
  description: string;
  onUpdate?: () => void;
}

export function DescriptionCard({ id, description, onUpdate }: DescriptionCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/edit-order?orderId=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editedDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      toast.success('Description updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Failed to update description');
    }
  };

  const handleCancel = () => {
    setEditedDescription(description);
    setIsEditing(false);
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Description</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Description
          </Button>
        )}
      </div>

      <div>
        {isEditing ? (
          <textarea
            className="w-full min-h-[200px] p-2 border rounded-md"
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Enter description..."
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </Card>
  );
} 