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
import { EmailAuthProvider, linkWithCredential, getAuth, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { countries } from 'countries-list';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Loading from "@/app/loading";

// Convert countries object to array and sort by name
const countryList = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name,
  native: country.native,
  phone: country.phone[0]
})).sort((a, b) => a.label.localeCompare(b.label));

interface UserProfile {
  photoURL?: string;
  email?: string;
  country?: string;
  city?: string;
  phoneNumbers?: string[];
}

const formatPhotoURL = (url: string) => {
  if (!url) return '/default-avatar.png';
  
  // Check if it's a Backblaze URL
  if (url.includes('backblazeb2.com')) {
    // Split the URL by '/'
    const urlParts = url.split('/');
    // Get the filename
    const fileName = urlParts[urlParts.length - 1];
    // Reconstruct the URL with profile_pictures directory
    return `https://f005.backblazeb2.com/file/a-plus-essays/profile_pictures/${fileName}`;
  }
  
  return url;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    photoURL: '/default-avatar.png',
    email: '',
    country: '',
    city: '',
    phoneNumbers: []
  });
  const [formData, setFormData] = useState({
    country: "",
    city: "",
    phoneNumbers: [] as string[],
    newPhoneNumber: ""
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            ...data,
            photoURL: data.photoURL ? formatPhotoURL(data.photoURL) : '/default-avatar.png',
            email: user.email || '',
            phoneNumbers: data.phoneNumbers || []
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Add check for anonymous user
  useEffect(() => {
    if (user) {
      const isAnon = user.isAnonymous;
      const hasEmailProvider = user.providerData.some(
        provider => provider.providerId === 'password' || provider.providerId === 'google.com'
      );
      setIsAnonymous(!hasEmailProvider && isAnon);
      setHasPassword(user.providerData.some(
        provider => provider.providerId === 'password'
      ));
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (section: string) => {
    if (!user) return;

    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        ...formData
      });

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...formData
      }));

      toast.success(`${section} settings saved`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.newPhoneNumber) return;

    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      
      const updatedPhoneNumbers = [...formData.phoneNumbers, formData.newPhoneNumber];
      
      await updateDoc(userRef, {
        phoneNumbers: updatedPhoneNumbers
      });

      // Update local state
      setFormData(prev => ({
        ...prev,
        phoneNumbers: updatedPhoneNumbers,
        newPhoneNumber: "" // Clear input
      }));

      setPopoverOpen(false);
      toast.success("Phone number added");
    } catch (error) {
      console.error('Error saving phone number:', error);
      toast.error('Failed to save phone number');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoneNumber = async (indexToRemove: number) => {
    if (!user) return;

    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      
      const updatedPhoneNumbers = formData.phoneNumbers.filter((_, index) => index !== indexToRemove);
      
      await updateDoc(userRef, {
        phoneNumbers: updatedPhoneNumbers
      });

      // Update local state
      setFormData(prev => ({
        ...prev,
        phoneNumbers: updatedPhoneNumbers
      }));

      toast.success("Phone number removed");
    } catch (error) {
      console.error('Error removing phone number:', error);
      toast.error('Failed to remove phone number');
    } finally {
      setSaving(false);
    }
  };

  // Function to convert anonymous account to email/password
  const handleSetPassword = async () => {
    if (!user || !userProfile?.email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setIsSettingPassword(true);

      // Create credential with email and password
      const credential = EmailAuthProvider.credential(
        userProfile.email,
        password
      );

      // Link anonymous account with email/password
      await linkWithCredential(user, credential);

      // Update local state
      setHasPassword(true);
      setPassword("");
      
      toast.success("Password set successfully. You can now sign in with email and password.");
    } catch (error: any) {
      console.error("Error setting password:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("This email is already associated with another account");
      } else if (error.code === 'auth/weak-password') {
        toast.error("Password should be at least 6 characters");
      } else {
        toast.error("Failed to set password. Please try again.");
      }
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Add password update function
  const handleUpdatePassword = async () => {
    if (!user || !currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    try {
      setIsUpdatingPassword(true);

      // Create credential with current password
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );

      // Reauthenticate
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        toast.error("Current password is incorrect");
      } else if (error.code === 'auth/weak-password') {
        toast.error("New password should be at least 6 characters");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile_pictures'); // Specify the directory

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.url) {
        // Update user profile with new photo URL
        const userRef = doc(db, 'users', user!.uid);
        await updateDoc(userRef, {
          photoURL: data.url
        });

        // Update local state with formatted URL
        setUserProfile(prev => ({
          ...prev,
          photoURL: formatPhotoURL(data.url)
        }));

        toast.success('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to update profile picture');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="pt-[80px]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:[&>*]:self-start">
          {/* Personal Info Section */}
          <Card className="p-6 dark:bg-gray-800 border border-secondary-gray-200 dark:border-secondary-gray-900">
            <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Personal Info</h2>
            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block text-gray-900 dark:text-white">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={userProfile.photoURL || '/default-avatar.png'} 
                      alt="Profile" 
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
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
                <Label htmlFor="email" className="text-sm text-muted-foreground text-gray-900 dark:text-white">Email*</Label>
                <Input 
                  id="email" 
                  value={userProfile?.email || user?.email || ''} 
                  disabled 
                  type="email"
                  className="bg-muted text-gray-900 dark:text-white"
                />
              </div>

              {/* Country and City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground text-gray-900 dark:text-white">Country</Label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange({
                      target: { name: 'country', value: e.target.value }
                    } as React.ChangeEvent<HTMLInputElement>)}
                    className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white"
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
                  <Label className="text-sm text-muted-foreground text-gray-900 dark:text-white">City</Label>
                  <Input 
                    name="city"
                    placeholder="Enter city" 
                    value={formData.city}
                    onChange={handleInputChange}
                    className="bg-background text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div>
                <Label className="text-sm text-muted-foreground text-gray-900 dark:text-white">Phone numbers</Label>
                <div className="space-y-2">
                  {/* Existing phone numbers */}
                  {formData.phoneNumbers.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        value={phone} 
                        disabled 
                        className="bg-muted flex-1 text-gray-900 dark:text-white"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemovePhoneNumber(index)}
                        disabled={saving}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  {/* Add new phone number */}
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-background text-gray-900 dark:text-white">
                        Add phone number
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-stroke dark:border-gray-700">
                      <form onSubmit={handlePhoneSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="newPhoneNumber" className="text-gray-900 dark:text-white">Phone Number</Label>
                          <Input
                            id="newPhoneNumber"
                            name="newPhoneNumber"
                            placeholder={formData.country ? `+${countries[formData.country]?.phone[0]}` : 'Select country first'}
                            value={formData.newPhoneNumber}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              newPhoneNumber: e.target.value
                            }))}
                            className="bg-background text-gray-900 dark:text-white"
                          />
                        </div>
                        <Button type="submit" disabled={saving || !formData.newPhoneNumber} className="text-white">
                          {saving ? 'Adding...' : 'Add Number'}
                        </Button>
                      </form>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button 
                onClick={() => handleSave('personal')} 
                className="w-full text-white"
                disabled={saving}
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </Card>

          {/* Security Section */}
          <Card className="p-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Security</h2>
            <div className="space-y-4">
              {isAnonymous ? (
                // Anonymous user - show set password form
                <>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
                      <Input 
                        id="email" 
                        value={userProfile?.email || user?.email || ''} 
                        disabled 
                        className="bg-muted text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="set-password" className="text-gray-900 dark:text-white">Set Password</Label>
                      <Input 
                        id="set-password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a strong password"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-gray-900 dark:text-white">
                      Setting a password will allow you to sign in with email and password in addition to your current sign-in method.
                    </p>
                    <Button 
                      onClick={handleSetPassword}
                      disabled={isSettingPassword || !password || !userProfile?.email}
                      className="w-full"
                    >
                      {isSettingPassword ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Setting Password...
                        </div>
                      ) : (
                        'Set Password'
                      )}
                    </Button>
                  </div>
                </>
              ) : hasPassword ? (
                // Email/Password user - show update password form
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password" className="text-gray-900 dark:text-white">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password" className="text-gray-900 dark:text-white">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <Button 
                      onClick={handleUpdatePassword}
                      disabled={isUpdatingPassword || !currentPassword || !newPassword}
                      className="w-full text-white"
                    >
                      {isUpdatingPassword ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating Password...
                        </div>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                // Google user - show message
                <div className="text-sm text-muted-foreground text-gray-900 dark:text-white">
                  You are signed in with Google. Password management is handled through your Google account.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 