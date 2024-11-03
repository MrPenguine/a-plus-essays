"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/config"; // Import the initialized auth instance
import { countries } from 'countries-list';

// Convert countries object to array and sort by name
const countryList = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name,
  native: country.native,
  phone: country.phone[0]
})).sort((a, b) => a.label.localeCompare(b.label));

export default function SettingsPage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const hasPasswordProvider = user.providerData.some(
        (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID
      );
      setHasPassword(hasPasswordProvider);
    }
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    toast.info("Photo upload functionality coming soon");
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
                    <AvatarImage src={user?.photoURL || ''} alt={user?.email || ''} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={uploading}
                      size="sm"
                    >
                      Upload a photo
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
                  value={user?.email || ''} 
                  disabled 
                  type="email"
                />
              </div>

              {/* Country and City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/100 backdrop-blur-lg border-stroke max-h-[300px]">
                      {countryList.map((country) => (
                        <SelectItem 
                          key={country.value} 
                          value={country.value}
                          className="hover:bg-muted"
                        >
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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