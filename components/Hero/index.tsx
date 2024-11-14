"use client";
import { Star, FileCheck, Check, User, Clock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/firebase/hooks";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleProjectCreation } from "@/lib/firebase/project-service";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/config";
import { dbService } from "@/lib/firebase/db-service";
import { collection, query, where, updateDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { signInAnonymously } from "firebase/auth";

const Hero = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('code');
  const [formData, setFormData] = useState({
    assignmentType: "",
    projectTitle: "",
    email: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      assignmentType: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.assignmentType || !formData.projectTitle || (!user && !formData.email)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create anonymous user
      const anonUser = await signInAnonymously(auth);
      const userId = anonUser.user.uid;

      // Create user in database
      await dbService.createUser({
        userid: userId,
        email: formData.email || '',
        name: '',
        balance: 0,
        createdAt: new Date().toISOString(),
        isAnonymous: true
      });

      // If there's a referral code, create referral record
      if (referralCode) {
        // Find the referral record and update it with the new user's ID
        const referralsRef = collection(db, 'referrals');
        const q = query(referralsRef, where('referralCode', '==', referralCode));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const referralDoc = snapshot.docs[0];
          await updateDoc(doc(referralsRef, referralDoc.id), {
            referred_uid: userId,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Create project
      const result = await handleProjectCreation(formData);
      
      if (result.success) {
        if (window.innerWidth < 768) {
          const searchParams = new URLSearchParams({
            title: formData.projectTitle,
            type: formData.assignmentType
          });
          router.push(`/chat?${searchParams.toString()}`);
        } else {
          const searchParams = new URLSearchParams({
            title: formData.projectTitle,
            type: formData.assignmentType
          });
          router.push(`/createproject?${searchParams.toString()}`);
        }
      } else {
        toast.error(result.error || "Failed to process request");
      }
    } catch (error) {
      console.error("Error processing submission:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleGetStarted = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      router.push('/chat');
    } else {
      router.push('/createproject');
    }
  };

  return (
    <section className="relative mt-[80px]">
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'var(--theme-image, url("/images/hero/hero-light.svg"))',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-16 grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        <h1 className="block lg:hidden text-3xl lg:text-4xl xl:text-6xl font-bold text-secondary-gray-900 dark:text-white">
          A-Plus Homework Help For All
        </h1>
        
        <div className="w-full max-w-md mx-auto lg:ml-auto order-1 lg:order-2">
          <div className="bg-white dark:bg-gray-900 border border-secondary-gray-200 dark:border-secondary-gray-800 rounded-lg p-6">
            <div className="space-y-1 mb-6">
              <h2 className="text-xl lg:text-2xl font-semibold text-secondary-gray-900 dark:text-white">
                {referralCode ? "Get Started with 20% Off" : "Get Started"}
              </h2>
              <p className="text-secondary-gray-600 dark:text-secondary-gray-300">
                {referralCode 
                  ? "Create your first order to claim your 20% discount"
                  : "Fill in the details to get help with your assignment"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label className="text-secondary-gray-900 dark:text-white">Assignment Type</Label>
                <select
                  name="assignmentType"
                  value={formData.assignmentType}
                  onChange={(e) => handleSelectChange(e.target.value)}
                  className="w-full rounded-lg border border-secondary-gray-200 bg-white dark:bg-gray-900 dark:border-secondary-gray-600 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select type of assignment</option>
                  <option value="essay">Essay</option>
                  <option value="research">Research Paper</option>
                  <option value="thesis">Thesis</option>
                  <option value="coursework">Coursework</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-secondary-gray-900 dark:text-white">Project Title</Label>
                <Input 
                  name="projectTitle"
                  placeholder="Enter your project title" 
                  className="bg-white border-secondary-gray-200 dark:bg-gray-900 dark:text-white dark:border-secondary-gray-600"
                  value={formData.projectTitle}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label className="text-secondary-gray-900 dark:text-white">Email</Label>
                  <Input 
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white border-secondary-gray-200 dark:bg-gray-900 dark:text-white dark:border-secondary-gray-600"
                    required
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-600 text-white"
              >
                {referralCode ? "Get Started with 20% Off" : "Get Started"}
              </Button>

              <p className="text-center text-sm text-secondary-gray-600 dark:text-secondary-gray-300">
                {referralCode 
                  ? "Your friend invited you - 20% discount will be applied"
                  : "Writers are ready to help you now"}
              </p>
            </form>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
          <h1 className="hidden lg:block text-3xl lg:text-4xl xl:text-6xl font-bold text-black dark:text-white">
            A-Plus Homework Help For All
          </h1>
          
          <div className="grid grid-cols-3 lg:flex lg:flex-wrap gap-2 lg:gap-4 text-xs lg:text-base ">
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-white shadow-solid-2 border-secondary-gray-200 dark:bg-gray-900 dark:border-secondary-gray-600">
              <FileCheck className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
              <span className="text-secondary-gray-600 dark:text-white">AI free content</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-white shadow-solid-2 border-secondary-gray-200 dark:bg-gray-900 dark:border-secondary-gray-600">
              <Check className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
              <span className="text-secondary-gray-600 dark:text-white">Plagiarism Free</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-white shadow-solid-2 border-secondary-gray-200 dark:bg-gray-900 dark:border-secondary-gray-600">
              <User className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
              <span className="text-secondary-gray-600 dark:text-white">Top Writers</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-white shadow-solid-2 border-secondary-gray-200 dark:bg-gray-900 dark:border-secondary-gray-600">
              <Clock className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
              <span className="text-secondary-gray-600 dark:text-white">Money back</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-white shadow-solid-2 border-secondary-gray-200 dark:bg-gray-900 dark:border-secondary-gray-600">
              <FileCheck className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
              <span className="text-secondary-gray-600 dark:text-white">Confidential</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-white shadow-solid-2 border-secondary-gray-200 dark:bg-gray-900 dark:border-secondary-gray-600">
              <Headphones className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
              <span className="text-secondary-gray-600 dark:text-white">24/7 Support</span>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-6 bg-white p-2 lg:p-4 rounded-lg shadow-solid-2 border-secondary-gray-200 dark:bg-gray-900 dark:border-secondary-gray-600">
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-yellow-300 text-yellow-300" />
              <span className="font-semibold text-secondary-gray-800 dark:text-white ">4.8</span>
              <span className="text-xs lg:text-sm text-secondary-gray-500">Review Centre</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-yellow-300 text-yellow-300" />
              <span className="font-semibold text-secondary-gray-800 dark:text-white">4.7</span>
              <span className="text-xs lg:text-sm text-secondary-gray-500">Sitejabber</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-yellow-300 text-yellow-300" />
              <span className="font-semibold text-secondary-gray-800 dark:text-white">4.7</span>
              <span className="text-xs lg:text-sm text-secondary-gray-500">Reviews.io</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
