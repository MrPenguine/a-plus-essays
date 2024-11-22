"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAuth } from "@/lib/firebase/hooks"

interface Tutor {
  tutorid: string;
  tutor_name: string;
  profile_picture?: string;
  highschool_cpp: number;
  masters_cpp: number;
  phd_cpp: number;
  undergraduate_cpp: number;
}

interface EditTutorCardProps {
  tutor: Tutor;
  onSave: (data: Partial<Tutor>) => void;
  onCancel: () => void;
}

export function EditTutorCard({ tutor, onSave, onCancel }: EditTutorCardProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    tutor_name: tutor.tutor_name,
    profile_picture: tutor.profile_picture || '',
    highschool_cpp: tutor.highschool_cpp.toString(),
    masters_cpp: tutor.masters_cpp.toString(),
    phd_cpp: tutor.phd_cpp.toString(),
    undergraduate_cpp: tutor.undergraduate_cpp.toString()
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile_pictures');

    try {
      setUploading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.url) {
        const formattedUrl = `https://f005.backblazeb2.com/file/a-plus-essays/profile_pictures/${data.url.split('/').pop()}`;
        
        // Update local state
        setFormData(prev => ({
          ...prev,
          profile_picture: formattedUrl
        }));

        // Automatically save the profile picture
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/edit-tutor?tutorId=${tutor.tutorid}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...tutor,
            profile_picture: formattedUrl
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update profile picture');
        }

        toast.success('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Convert string values to numbers for cpp fields
      const processedData = {
        ...formData,
        highschool_cpp: Number(formData.highschool_cpp),
        masters_cpp: Number(formData.masters_cpp),
        phd_cpp: Number(formData.phd_cpp),
        undergraduate_cpp: Number(formData.undergraduate_cpp)
      };

      await onSave(processedData);
    } catch (error) {
      console.error('Error saving tutor:', error);
      toast.error('Failed to save changes');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={formData.profile_picture || '/default-avatar.png'} 
              alt="Profile" 
            />
            <AvatarFallback>{formData.tutor_name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('tutor-photo-upload-edit')?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full p-0"
          >
            +
          </Button>
          <input
            id="tutor-photo-upload-edit"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
        </div>
        <div className="flex-1">
          <Input
            value={formData.tutor_name}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              tutor_name: e.target.value
            }))}
            placeholder="Tutor Name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="High School Rate"
          type="number"
          value={formData.highschool_cpp}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            highschool_cpp: e.target.value
          }))}
        />
        <Input
          placeholder="Undergraduate Rate"
          type="number"
          value={formData.undergraduate_cpp}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            undergraduate_cpp: e.target.value
          }))}
        />
        <Input
          placeholder="Masters Rate"
          type="number"
          value={formData.masters_cpp}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            masters_cpp: e.target.value
          }))}
        />
        <Input
          placeholder="PhD Rate"
          type="number"
          value={formData.phd_cpp}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            phd_cpp: e.target.value
          }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
} 