"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";

interface Tutor {
  tutorid: string;
  tutor_name: string;
  profile_picture?: string;
  highschool_cpp: number;
  undergraduate_cpp: number;
  masters_cpp: number;
  phd_cpp: number;
}

interface TutorAssignmentCardProps {
  orderId: string;
  level: string;
  pages: number;
  onUpdate: () => void;
}

export function TutorAssignmentCard({ orderId, level, pages, onUpdate }: TutorAssignmentCardProps) {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Calculate price based on tutor's rates and order details
  const calculatePrice = (tutor: Tutor) => {
    const costPerPage = (() => {
      switch (level?.toLowerCase()) {
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
    })();

    return costPerPage * pages;
  };

  useEffect(() => {
    const fetchTutors = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/fetch-tutors', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tutors');
        }

        const data = await response.json();
        // Ensure each tutor has a unique ID
        const tutorsWithUniqueIds = data.tutors.map((tutor: Tutor) => ({
          ...tutor,
          uniqueId: `${tutor.tutorid}_${Math.random().toString(36).substring(7)}`
        }));
        setTutors(tutorsWithUniqueIds);
      } catch (error) {
        console.error('Error fetching tutors:', error);
        toast.error('Failed to load tutors');
      }
    };

    fetchTutors();
  }, [user]);

  const handleAssignTutor = async () => {
    if (!selectedTutor || !user) return;

    setLoading(true);
    try {
      const selectedTutorData = tutors.find(t => t.tutorid === selectedTutor);
      if (!selectedTutorData) {
        throw new Error('Selected tutor not found');
      }

      const price = calculatePrice(selectedTutorData);

      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/edit-order?orderId=${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorid: selectedTutor,
          status: 'pending',
          price: price,
          originalPrice: price
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign tutor');
      }

      toast.success('Tutor assigned successfully');
      onUpdate();
    } catch (error) {
      console.error('Error assigning tutor:', error);
      toast.error('Failed to assign tutor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <h2 className="text-lg font-semibold mb-4">Assign Tutor</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={selectedTutor}
          onValueChange={setSelectedTutor}
        >
          <SelectTrigger className="w-full sm:w-[300px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Select a tutor" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            {tutors.map((tutor) => (
              <SelectItem 
                key={tutor.uniqueId}
                value={tutor.tutorid}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="truncate">
                  {tutor.tutor_name} - ${calculatePrice(tutor)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleAssignTutor}
          disabled={!selectedTutor || loading}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90"
        >
          {loading ? 'Assigning...' : 'Assign Tutor'}
        </Button>
      </div>
    </Card>
  );
} 