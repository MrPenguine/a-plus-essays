"use client"

import { useState } from "react"
import { useAuth } from "@/lib/firebase/hooks"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

interface AddTutorCardProps {
  onTutorAdded: () => void;
}

export function AddTutorCard({ onTutorAdded }: AddTutorCardProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    tutor_name: '',
    profile_picture: '',
    highschool_cpp: '',
    masters_cpp: '',
    phd_cpp: '',
    undergraduate_cpp: ''
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile_pictures'); // Specify the directory

    try {
      setUploading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.url) {
        setFormData(prev => ({
          ...prev,
          profile_picture: data.url
        }));
        toast.success('Profile picture uploaded');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/add-tutor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to add tutor');
      }

      toast.success('Tutor added successfully');
      onTutorAdded();
      
      // Reset form
      setFormData({
        tutor_name: '',
        profile_picture: '',
        highschool_cpp: '',
        masters_cpp: '',
        phd_cpp: '',
        undergraduate_cpp: ''
      });
    } catch (error) {
      console.error('Error adding tutor:', error);
      toast.error('Failed to add tutor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={formData.profile_picture || '/default-avatar.png'} 
              alt="Profile" 
            />
            <AvatarFallback>
              {formData.tutor_name.substring(0, 2).toUpperCase() || 'T'}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('tutor-photo-upload')?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full p-0"
          >
            +
          </Button>
          <input
            id="tutor-photo-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Tutor Name"
            value={formData.tutor_name}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              tutor_name: e.target.value
            }))}
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

      <Button 
        className="w-full"
        onClick={handleSubmit}
        disabled={saving || !formData.tutor_name}
      >
        {saving ? 'Adding Tutor...' : 'Add Tutor'}
      </Button>
    </Card>
  );
} 