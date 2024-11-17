"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/firebase/hooks";
import { dbService } from "@/lib/firebase/db-service";
import { toast } from "sonner";
import { Copy, Facebook, Twitter } from "lucide-react";
import Image from "next/image";

interface ReferralStats {
  totalReferred: number;
  pendingRedemptions: number;
  redeemedCount: number;
}

export default function GetBonusPage() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    pendingRedemptions: 0,
    redeemedCount: 0
  });

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) return;

      try {
        // Get user data
        const userDoc = await dbService.getUser(user.uid);
        if (userDoc?.referralCode) {
          setReferralCode(userDoc.referralCode);
        }

        // Get referral stats
        const referralStats = await dbService.getReferralStats(user.uid);
        setStats(referralStats);
      } catch (error) {
        console.error("Error fetching referral data:", error);
      }
    };

    fetchReferralData();
  }, [user]);

  const handleGetReferralCode = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const code = await dbService.createReferralCode(user.uid);
      setReferralCode(code);
      toast.success("Referral code generated successfully!");
    } catch (error) {
      console.error("Error generating referral code:", error);
      toast.error("Failed to generate referral code");
    } finally {
      setLoading(false);
    }
  };

  const referralLink = referralCode 
    ? `${window.location.origin}/referred?code=${referralCode}`
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Invite Friends & Earn</h1>

      {/* Main Card */}
      <Card className="relative overflow-hidden mb-10">
        <div className="grid md:grid-cols-2 items-center">
          <div className="px-8 py-8 md:pr-4">
            <div className="max-w-md">
              <h2 className="text-xl font-semibold mb-2">Invite a Friend</h2>
              <p className="text-secondary-gray-500 mb-6">
                Show A+ Essays to your friend and you both get a $20 discount.
                The more friends you invite, the less you pay!
              </p>

              {/* Referral Link Section */}
              <div className="space-y-4">
                {!referralCode ? (
                  <Button
                    onClick={handleGetReferralCode}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Generating..." : "Get Your Referral Code"}
                  </Button>
                ) : (
                  <>
                    <p className="text-sm font-medium">Send this link to your friend</p>
                    <div className="flex gap-2">
                      <Input 
                        value={referralLink}
                        readOnly
                        className="bg-secondary-gray-100"
                      />
                      <Button 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(referralLink);
                          toast.success("Link copied to clipboard!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-secondary-gray-500 text-center">
                      Or just share it
                    </p>

                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex gap-2"
                        onClick={() => {
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
                            '_blank'
                          );
                        }}
                      >
                        <Facebook className="h-5 w-5" />
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex gap-2"
                        onClick={() => {
                          window.open(
                            `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Get $20 off your first order!')}`,
                            '_blank'
                          );
                        }}
                      >
                        <Twitter className="h-5 w-5" />
                        Twitter
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative h-[300px] md:h-full w-full">
            <Image
              src="/images/referral-illustration.svg"
              alt="Referral illustration"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </Card>

      {/* How it Works Card */}
      <Card className="p-8">
        <h2 className="text-xl font-semibold mb-6">How to Get the Bonus?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Image
                src="/images/share-icon.svg"
                alt="Share"
                width={32}
                height={32}
              />
            </div>
            <p className="text-sm">
              Share your personal link with your friends
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Image
                src="/images/signup-icon.svg"
                alt="Sign up"
                width={32}
                height={32}
              />
            </div>
            <p className="text-sm">
              Let your friend sign up on A+ Essays and get their $20 bonus
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Image
                src="/images/bonus-icon.svg"
                alt="Get bonus"
                width={32}
                height={32}
              />
            </div>
            <p className="text-sm">
              Get your $20 bonus once your friend pays for the first project
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 pt-8 border-t grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalReferred}</p>
            <p className="text-sm text-secondary-gray-500">Friends Invited</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.pendingRedemptions}</p>
            <p className="text-sm text-secondary-gray-500">Pending Bonuses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.redeemedCount}</p>
            <p className="text-sm text-secondary-gray-500">Bonuses Redeemed</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 