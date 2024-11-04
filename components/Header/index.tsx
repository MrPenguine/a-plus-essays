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

const Header = () => {
  const [stickyMenu, setStickyMenu] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      toast.success("Logged out successfully");
      router.push('/auth/signin');
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleCreateProject = () => {
    if (window.innerWidth < 768) {
      router.push('/chat');
      return;
    }
  };

  const getAvatarDetails = () => {
    if (!user) return { image: 'https://github.com/shadcn.png', fallback: 'CN', label: 'Guest' };

    return {
      image: 'https://github.com/shadcn.png',
      fallback: 'CN',
      label: 'New User'
    };
  };

  return (
    <header
      className={`fixed left-0 top-0 z-[999] w-full bg-white/80 backdrop-blur-sm dark:bg-black/80 ${
        stickyMenu ? "shadow-sticky" : ""
      }`}
    >
      <div className="relative mx-auto max-w-c-1390 items-center justify-between px-4 md:px-8 xl:flex 2xl:px-0">
        <div className="flex w-full items-center justify-between xl:w-1/4">
          <Link href="/" className="block w-full py-5 text-2xl font-bold">
            A+ Essays
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
                    <Popover>
                      <PopoverTrigger className="w-full">
                        <div 
                          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90 cursor-pointer"
                          onClick={handleCreateProject}
                        >
                          Create Project
                        </div>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-[400px] p-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg" 
                        sideOffset={5}
                      >
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="title" className="text-sm font-medium text-black dark:text-white">
                                Project title<span className="text-red-500">*</span>
                              </Label>
                              <Input 
                                id="title" 
                                placeholder="Enter project title"
                                className="bg-white dark:bg-gray-900"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="description" className="text-sm font-medium text-black dark:text-white">
                                Brief description
                              </Label>
                              <Textarea
                                id="description"
                                placeholder="I need..."
                                className="min-h-[100px] bg-white dark:bg-gray-900"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="project-type" className="text-sm font-medium text-black dark:text-white">
                                  Project type<span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                  id="project-type" 
                                  placeholder="Enter project type"
                                  className="bg-white dark:bg-gray-900"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="subject-area" className="text-sm font-medium text-black dark:text-white">
                                  Subject area<span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                  id="subject-area" 
                                  placeholder="Enter subject area"
                                  className="bg-white dark:bg-gray-900"
                                />
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <button 
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
                              >
                                <Paperclip className="h-4 w-4" />
                                Attach
                              </button>
                              <button 
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
                              >
                                <Calendar className="h-4 w-4" />
                                Deadline
                              </button>
                              <button 
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
                              >
                                <Users className="h-4 w-4" />
                                Invite an expert
                              </button>
                            </div>

                            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Switch id="auto-match" />
                                <Label htmlFor="auto-match" className="text-sm">Auto-match</Label>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                We will choose the best expert for you
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between pt-2">
                            <button 
                              className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
                              onClick={() => router.back()}
                            >
                              Back
                            </button>
                            <button 
                              onClick={() => router.push('/chat')}
                              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90"
                            >
                              Create
                            </button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                  <li>
                    <div className="text-sm font-medium text-black dark:text-white">
                      Balance: $0.00
                    </div>
                  </li>
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
                      <AvatarImage src="https://github.com/shadcn.png" alt="Profile" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || 'New User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        New User
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
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