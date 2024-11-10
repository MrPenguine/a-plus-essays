"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { EmailAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { countries } from 'countries-list';
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Convert countries object to array and sort by name
const countryList = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name,
  native: country.native,
  phone: country.phone[0]
})).sort((a, b) => a.label.localeCompare(b.label));

interface UserProfile {
  photoURL?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const hasPasswordProvider = user.providerData.some(
        (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID
      );
      setHasPassword(hasPasswordProvider);
    }
  }, [user]);

  // Add useEffect to fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Update getAvatarDetails to match header implementation
  const getAvatarDetails = () => {
    if (!user) return { image: '/default-avatar.png', fallback: 'CN' };

    // Check Firestore profile picture first
    if (userProfile?.photoURL) {
      return {
        image: userProfile.photoURL,
        fallback: (user.displayName || 'User').substring(0, 2).toUpperCase()
      };
    }

    // Then check Firebase Auth photo
    if (user.providerData[0]?.photoURL) {
      return {
        image: user.providerData[0].photoURL,
        fallback: (user.displayName || 'User').substring(0, 2).toUpperCase()
      };
    }

    // Default avatar
    return {
      image: '/default-avatar.png',
      fallback: (user.displayName || 'User').substring(0, 2).toUpperCase()
    };
  };

  // Update handlePhotoUpload to refresh the profile
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { fileUrl } = await response.json();

      // Update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: fileUrl
      });

      // Update local state immediately
      setUserProfile(prev => ({
        ...prev,
        photoURL: fileUrl
      }));

      toast.success('Profile picture updated');

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (section: string) => {
    toast.success(`${section} settings saved`);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      toast.success("Phone number saved");
      setPopoverOpen(false);
    }
  };

  return (
    <div className="pt-[80px]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Personal Info</h2>
            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {uploading ? (
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <>
                        <AvatarImage src={getAvatarDetails().image} alt="Profile" />
                        <AvatarFallback>{getAvatarDetails().fallback}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={uploading}
                      size="sm"
                    >
                      {uploading ? 'Uploading...' : 'Upload a photo'}
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm text-muted-foreground">Email*</Label>
                <Input 
                  id="email" 
                  value={user?.email || 'New User'} 
                  disabled 
                  type="email"
                />
              </div>

              {/* Country and City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Country</Label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select country</option>
                    {countryList.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">City</Label>
                  <Input 
                    placeholder="Enter city" 
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <Label className="text-sm text-muted-foreground">Phone number</Label>
                <div className="flex items-center gap-2">
                  {phoneNumber ? (
                    <div className="flex-1">
                      <Input 
                        value={phoneNumber} 
                        disabled 
                        className="bg-background"
                        placeholder={selectedCountry ? `+${countries[selectedCountry].phone[0]}` : ''}
                      />
                    </div>
                  ) : (
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-background">
                          Add phone number
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-background/100 backdrop-blur-lg border-stroke">
                        <form onSubmit={handlePhoneSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              placeholder={selectedCountry ? `+${countries[selectedCountry].phone[0]}` : 'Select country first'}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="bg-background"
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Save
                          </Button>
                        </form>
                      </PopoverContent>
                    </Popover>
                  )}
                  {phoneNumber && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setPhoneNumber("")}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <Button onClick={() => handleSave('personal')} className="w-full">
                Save Changes
              </Button>
            </div>
          </Card>

          {/* Security Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Security</h2>
            <div className="space-y-4">
              {hasPassword ? (
                <>
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <Button onClick={() => handleSave('security')}>Update Password</Button>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="set-password">Set Password</Label>
                    <Input id="set-password" type="password" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Setting a password will allow you to sign in with email and password in addition to Google.
                  </p>
                  <Button onClick={() => handleSave('security')}>Set Password</Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 