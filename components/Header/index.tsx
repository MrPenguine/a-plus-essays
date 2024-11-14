"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/firebase/hooks";
import { logout } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Paperclip, Calendar, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { handleProjectCreation } from "@/lib/firebase/project-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { dbService } from '@/lib/firebase/db-service';
import NotificationBadge from "@/components/Notifications/NotificationBadge";
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

interface UserProfile {
  email: string;
  name: string;
  balance: number;
  photoURL?: string;
}

const Header = () => {
  useOrderNotifications();

  const [stickyMenu, setStickyMenu] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    assignmentType: "",
    projectTitle: "",
    email: ""
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      if (!uid || !user) {
        console.error('No UID or user provided');
        return;
      }

      const userDocRef = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        setUserProfile(userSnapshot.data() as UserProfile);
      } else {
        console.log('User document not found, creating new user...');
        const userData = {
          userid: uid,
          email: user.email || '',
          name: user.displayName || '',
          balance: 0,
          createdAt: new Date().toISOString(),
          isAnonymous: false
        };

        await dbService.createUser(userData);
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      if (error instanceof Error && error.message.includes('permission-denied')) {
        await handleLogout();
      }
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      if (!user) return;
      
      if (!user.uid) {
        console.error('No user UID found');
        await handleLogout();
        return;
      }

      await fetchUserProfile(user.uid);
    };

    checkUser();
  }, [user]);

  const handleStickyMenu = () => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleStickyMenu);
    
    return () => {
      window.removeEventListener("scroll", handleStickyMenu);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUserProfile(null);
      toast.success("Logged out successfully");
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error logging out");
      window.location.href = '/auth/signin';
    }
  };

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

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.assignmentType || !formData.projectTitle || (!user && !formData.email)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await handleProjectCreation(formData);
      
      if (result.success) {
        // Check if mobile
        if (window.innerWidth < 768) {
          const searchParams = new URLSearchParams({
            title: formData.projectTitle,
            type: formData.assignmentType
          });
          router.push(`/chat?${searchParams.toString()}`);
        } else {
          // Desktop: go to create project page
          const searchParams = new URLSearchParams({
            title: formData.projectTitle,
            type: formData.assignmentType
          });
          router.push(`/createproject?${searchParams.toString()}`);
        }
      } else {
        if (result.redirect) {
          toast.error(result.error || "Failed to process request");
          router.push(result.redirect);
        } else {
          toast.error(result.error || "Failed to process request");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

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

  return (
    <header
      className={`fixed left-0 top-0 z-[999] w-full bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 ${
        stickyMenu ? "shadow-sticky" : ""
      }`}
    >
      <div className="relative mx-auto max-w-c-1390 items-center justify-between px-4 md:px-8 xl:flex 2xl:px-0">
        <div className="flex w-full items-center justify-between xl:w-1/4">
          <Link href="/" className="block py-0">
            <div className="flex items-center h-[80px]">
              <div className="h-[76px] relative" style={{ aspectRatio: '2.925' }}>
                <Image 
                  src="/favicon.ico" 
                  alt="A+ Essays"
                  fill
                  className="object-contain"
                  style={{ objectPosition: 'left center' }}
                  priority
                />
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4 xl:hidden">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <span aria-hidden="true">🌞</span>
              ) : (
                <span aria-hidden="true">🌙</span>
              )}
            </button>

            <button
              onClick={() => setNavigationOpen(!navigationOpen)}
              className="xl:hidden"
            >
              <span className="relative block h-5.5 w-5.5 cursor-pointer">
                <span className="absolute right-0 block h-full w-full">
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!w-full" : "top-2 !w-0"
                    }`}
                  ></span>
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!w-full" : "!w-0"
                    }`}
                  ></span>
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!w-full" : "!w-0"
                    }`}
                  ></span>
                </span>
                <span className="absolute right-0 h-full w-full rotate-45">
                  <span
                    className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!h-0" : "!h-full"
                    }`}
                  ></span>
                  <span
                    className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!w-0" : "!w-full"
                    }`}
                  ></span>
                </span>
              </span>
            </button>
          </div>
        </div>

        <div
          className={`invisible h-0 w-full items-center justify-between xl:visible xl:flex xl:h-auto xl:w-full ${
            navigationOpen &&
            "navbar !visible mt-4 h-auto max-h-[400px] rounded-md bg-white p-7.5 shadow-solid-5 dark:bg-blacksection xl:h-auto xl:p-0 xl:shadow-none xl:dark:bg-transparent"
          }`}
        >
          <nav>
            <ul className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-10">
              {user ? (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-sm font-medium text-black hover:text-primary dark:text-white dark:hover:text-primary"
                    >
                      Your Projects
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/getbonus"
                      className="text-sm font-medium text-black hover:text-primary dark:text-white dark:hover:text-primary"
                    >
                      Get $20 Bonus
                    </Link>
                  </li>
                  <li>
                    <Link href="/createproject">
                      <Button
                        className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white dark:hover:bg-primary/90 dark:hover:text-white"
                      >
                        Create Project
                      </Button>
                    </Link>
                  </li>
                  {userProfile && (
                    <li>
                      <div className="text-sm font-medium text-black dark:text-white">
                        Balance: ${userProfile.balance.toFixed(2)}
                      </div>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/"
                      className="text-sm font-medium text-black hover:text-primary dark:text-white dark:hover:text-primary"
                    >
                      Project Types we Cover
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/dashboard" 
                      className="text-sm font-medium text-black hover:text-primary dark:text-white dark:hover:text-primary"
                    >
                      Academic Fields & Subjects
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/" 
                      className="text-sm font-medium text-black hover:text-primary dark:text-white dark:hover:text-primary"
                    >
                      Reviews
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-6 mt-7 xl:mt-0">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <span aria-hidden="true">🌞</span>
              ) : (
                <span aria-hidden="true">🌙</span>
              )}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={getAvatarDetails().image} 
                        alt="Profile"
                        className="object-cover"
                        priority
                      />
                      <AvatarFallback>{getAvatarDetails().fallback}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 bg-white dark:bg-gray-950 border border-secondary-gray-200 dark:border-secondary-gray-800" 
                  align="end" 
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-secondary-gray-600 dark:text-secondary-gray-300">
                        {user.displayName || 'New User'}
                      </p>
                      <p className="text-xs text-muted-foreground text-secondary-gray-600 dark:text-secondary-gray-300">
                        {userProfile?.email || user?.email || ''}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="w-full">
                      <Settings className="mr-2 h-4 w-4 dark:text-white" />
                      <span className="text-medium font-primary text-secondary-gray-600 dark:text-secondary-gray-300">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4 dark:text-white" />
                    <span className="text-secondary-gray-600 dark:text-secondary-gray-300">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;