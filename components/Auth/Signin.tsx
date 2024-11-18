"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInWithEmail, signInWithGoogle, signInAsGuest } from "@/lib/firebase/auth";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const Signin = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userAuthType, setUserAuthType] = useState<'none' | 'google' | 'password' | 'anonymous' | null>(null);
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error' | null;
  }>({ text: '', type: null });

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user, error } = await signInWithEmail(data.email, data.password);
      
      if (error) {
        if (error.message.includes('auth/invalid-credential')) {
          const passwordInput = document.getElementById('password') as HTMLInputElement;
          if (passwordInput) {
            passwordInput.classList.add('border-red-500', 'focus:ring-red-500');
          }
          setStatusMessage({
            text: "Invalid password",
            type: 'error'
          });
          return;
        }
        setStatusMessage({
          text: error.message,
          type: 'error'
        });
        return;
      }

      if (user) {
        router.push("/dashboard");
      }
    } catch (error) {
      setStatusMessage({
        text: "Something went wrong. Please try again.",
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserExists = async (email: string) => {
    setIsLoading(true);
    setStatusMessage({ text: '', type: null });
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        router.push(`/auth/signup?email=${encodeURIComponent(data.email)}`);
        return null;
      }

      const userData = querySnapshot.docs[0].data();
      const userId = userData.userid;

      const response = await fetch('/api/check-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const { authMethod } = await response.json();
      setUserAuthType(authMethod);

      if (authMethod === 'anonymous') {
        const setPasswordResponse = await fetch('/api/send-set-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const result = await setPasswordResponse.json();
        
        if (result.success) {
          if (result.showPassword) {
            setShowPassword(true);
          } else {
            setStatusMessage({
              text: "We've sent you an email to set your password!",
              type: 'success'
            });
          }
        } else {
          setStatusMessage({
            text: result.error || "Failed to send password reset email",
            type: 'error'
          });
        }
      } else if (authMethod === 'google') {
        setStatusMessage({
          text: "Please use the 'Sign in with Google' button below",
          type: 'info'
        });
      } else if (authMethod === 'password') {
        setShowPassword(true);
      }

      return authMethod;
    } catch (error) {
      console.error('Error checking user:', error);
      setStatusMessage({
        text: "An error occurred. Please try again.",
        type: 'error'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.email) return;
    await checkUserExists(data.email);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        setStatusMessage({
          text: error.message,
          type: 'error'
        });
        return;
      }

      if (user) {
        router.push("/dashboard");
      }
    } catch (error) {
      setStatusMessage({
        text: "Something went wrong. Please try again.",
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);

    try {
      const { user, error } = await signInAsGuest();
      
      if (error) {
        setStatusMessage({
          text: error.message,
          type: 'error'
        });
        return;
      }

      if (user) {
        router.push("/dashboard");
      }
    } catch (error) {
      setStatusMessage({
        text: "Something went wrong. Please try again.",
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, email: e.target.value });
    if (showPassword) {
      setShowPassword(false);
      setStatusMessage({ text: '', type: null });
      setUserAuthType(null);
    }
  };

  return (
    <section className="pb-12.5 pt-32.5 lg:pb-25 lg:pt-45 xl:pb-30 xl:pt-50 bg-secondary-gray-50 backdrop-blur-sm dark:bg-gray-900">
      <div className="relative mx-auto max-w-[400px] px-4">
        <motion.div
          variants={{
            hidden: {
              opacity: 0,
              y: -20,
            },
            visible: {
              opacity: 1,
              y: 0,
            },
          }}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 1, delay: 0.1 }}
          viewport={{ once: true }}
          className="animate_top w-full"
        >
          <Card className="bg-secondary-gray-50 dark:bg-gray-950 border-secondary-gray-100 dark:border-secondary-gray-800 shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={showPassword ? handleEmailSignIn : handleContinue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-secondary-gray-700 dark:text-secondary-gray-50">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={data.email}
                    onChange={handleEmailChange}
                    className="text-secondary-gray-700 dark:text-secondary-gray-50 border-secondary-gray-900 dark:border-secondary-gray-400 border-primary-color-100 dark:border-primary-color-900"
                    required
                  />
                </div>

                {showPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-secondary-gray-700 dark:text-secondary-gray-50">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={data.password}
                      onChange={(e) => setData({ ...data, password: e.target.value })}
                      required
                      className="text-secondary-gray-700 dark:text-secondary-gray-50 border-secondary-gray-700 dark:border-secondary-gray-400 border-primary-color-100 dark:border-primary-color-900"
                    />
                  </div>
                )}

                {statusMessage.text && (
                  <div className={`text-sm p-2 rounded ${
                    statusMessage.type === 'success' ? 'bg-green-50 text-green-600' :
                    statusMessage.type === 'info' ? 'bg-blue-50 text-blue-600' :
                    statusMessage.type === 'error' ? 'bg-red-50 text-red-600' : ''
                  }`}>
                    {statusMessage.text}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center text-white dark:text-white">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white text-white" />
                    </div>
                  ) : showPassword ? (
                    "Sign in"
                  ) : (
                    "Continue"
                  )}
                </Button>

                {showPassword && (
                  <div className="text-sm text-center">
                    <Link
                      href="/auth/forgot-password"
                      className="text-secondary-mint-300 hover:text-primary/90"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-secondary-gray-50 dark:bg-gray-950 dark:text-gray-400 px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </div>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link 
                  href="/auth/signup"
                  className="text-primary dark:text-secondary-gray-50 hover:text-customblue/90 font-semibold"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default Signin;
