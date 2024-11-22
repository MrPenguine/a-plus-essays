"use client"

import { Card } from "@/components/ui/card";
import { format, isValid, parseISO } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBJECTS, ASSIGNMENT_TYPES } from "@/lib/constants";

const LEVELS = [
  'High School',
  'Undergraduate',
  'Masters',
  'PhD'
] as const;

// Add this style to the SelectContent components
const selectContentStyles = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700";

interface AssignmentDetailsCardProps {
  id: string;
  subject: string;
  level: string;
  assignment_type: string;
  pages: number;
  wordcount: number;
  deadline: string;
  description: string;
  price: number;
  onUpdate?: () => void;
}

export function AssignmentDetailsCard({
  id,
  subject,
  level,
  assignment_type,
  pages,
  wordcount,
  deadline,
  description,
  price,
  onUpdate
}: AssignmentDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    subject,
    level,
    assignment_type,
    pages: pages.toString(),
    wordcount: wordcount.toString(),
    deadline,
    description,
    price: price.toString()
  });
  const { user } = useAuth();

  const formatDeadline = (dateString: string) => {
    try {
      // First try parsing as ISO string
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, "MMM d, yyyy h:mm a");
      }

      // If not ISO, try as regular date
      const regularDate = new Date(dateString);
      if (isValid(regularDate)) {
        return format(regularDate, "MMM d, yyyy h:mm a");
      }

      // If both fail, return the original string
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

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
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      toast.success('Order details updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleCancel = () => {
    setFormData({
      subject,
      level,
      assignment_type,
      pages: pages.toString(),
      wordcount: wordcount.toString(),
      deadline,
      description,
      price: price.toString()
    });
    setIsEditing(false);
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Assignment Details</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Details</Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isEditing ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  subject: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className={selectContentStyles}>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  level: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className={selectContentStyles}>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Select
                value={formData.assignment_type}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  assignment_type: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className={selectContentStyles}>
                  {ASSIGNMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pages</p>
              <Input
                type="number"
                value={formData.pages}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pages: e.target.value
                }))}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Word Count</p>
              <Input
                type="number"
                value={formData.wordcount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  wordcount: e.target.value
                }))}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <Input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  deadline: e.target.value
                }))}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  price: e.target.value
                }))}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium">{subject}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="font-medium">{level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{assignment_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pages</p>
              <p className="font-medium">{pages}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Word Count</p>
              <p className="font-medium">{wordcount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="font-medium">{formatDeadline(deadline)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">{price}</p>
            </div>
          </>
        )}
      </div>

      {/* Description Section */}
      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-2">Description</p>
        {isEditing ? (
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              description: e.target.value
            }))}
          />
        ) : (
          <p className="whitespace-pre-wrap">{description}</p>
        )}
      </div>
    </Card>
  );
} 