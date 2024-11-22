"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AddTutorCard } from "@/components/admin/add-tutor-card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import { EditTutorCard } from "@/components/admin/edit-tutor-card"

interface Tutor {
  tutorid: string;
  tutor_name: string;
  profile_picture?: string;
  highschool_cpp: number;
  masters_cpp: number;
  phd_cpp: number;
  undergraduate_cpp: number;
}

interface EditingTutor extends Tutor {
  isEditing?: boolean;
  isDeleting?: boolean;
}

function TutorSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[200px]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function TutorsGrid() {
  const [tutors, setTutors] = useState<EditingTutor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddCard, setShowAddCard] = useState(false)
  const { user } = useAuth()

  const fetchTutors = async () => {
    if (!user) return;

    try {
      setLoading(true);
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
      setTutors(data.tutors);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [user]);

  const filteredTutors = tutors.filter(tutor => 
    tutor.tutor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.tutorid.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async (tutorId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/delete-tutor?tutorId=${tutorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete tutor');
      }

      setTutors(prev => prev.filter(t => t.tutorid !== tutorId));
      toast.success('Tutor deleted successfully');
    } catch (error) {
      console.error('Error deleting tutor:', error);
      toast.error('Failed to delete tutor');
    }
  };

  const handleEdit = async (tutorId: string, updatedData: Partial<Tutor>) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/edit-tutor?tutorId=${tutorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to update tutor');
      }

      setTutors(prev => prev.map(t => 
        t.tutorid === tutorId 
          ? { ...t, ...updatedData, isEditing: false }
          : t
      ));
      toast.success('Tutor updated successfully');
    } catch (error) {
      console.error('Error updating tutor:', error);
      toast.error('Failed to update tutor');
    }
  };

  if (loading) return <TutorSkeleton />

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-10"
          placeholder="Search tutors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className={cn(
            "p-6 cursor-pointer transition-all duration-300",
            !showAddCard && "flex items-center justify-center"
          )}
          onClick={() => !showAddCard && setShowAddCard(true)}
        >
          {showAddCard ? (
            <AddTutorCard 
              onTutorAdded={() => {
                fetchTutors();
                setShowAddCard(false);
              }}
              onCancel={() => setShowAddCard(false)}
            />
          ) : (
            <Plus 
              className="h-12 w-12 text-gray-400 transition-transform duration-300 hover:scale-110" 
            />
          )}
        </Card>
        {filteredTutors.map((tutor) => (
          <Card key={tutor.tutorid} className="p-6 space-y-4">
            {tutor.isEditing ? (
              <EditTutorCard
                tutor={tutor}
                onSave={(data) => handleEdit(tutor.tutorid, data)}
                onCancel={() => setTutors(prev => 
                  prev.map(t => t.tutorid === tutor.tutorid ? { ...t, isEditing: false } : t)
                )}
              />
            ) : tutor.isDeleting ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-destructive">Delete Tutor</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this tutor? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setTutors(prev => 
                      prev.map(t => t.tutorid === tutor.tutorid ? { ...t, isDeleting: false } : t)
                    )}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(tutor.tutorid)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={tutor.profile_picture} />
                      <AvatarFallback>{tutor.tutor_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{tutor.tutor_name}</h3>
                      <p className="text-sm text-gray-500">ID: {tutor.tutorid.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTutors(prev => 
                        prev.map(t => t.tutorid === tutor.tutorid ? { ...t, isEditing: true } : t)
                      )}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTutors(prev => 
                        prev.map(t => t.tutorid === tutor.tutorid ? { ...t, isDeleting: true } : t)
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {tutor.highschool_cpp > 0 && (
                    <Badge variant="secondary">
                      High School: ${tutor.highschool_cpp}
                    </Badge>
                  )}
                  {tutor.undergraduate_cpp > 0 && (
                    <Badge variant="secondary">
                      Undergraduate: ${tutor.undergraduate_cpp}
                    </Badge>
                  )}
                  {tutor.masters_cpp > 0 && (
                    <Badge variant="secondary">
                      Masters: ${tutor.masters_cpp}
                    </Badge>
                  )}
                  {tutor.phd_cpp > 0 && (
                    <Badge variant="secondary">
                      PhD: ${tutor.phd_cpp}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
} 