import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function InviteFriendsCard() {
  return (
    <Card className="p-6 border-primary-100 dark:border-primary-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-secondary-gray-50">Get 20% off for being a good friend!</h2>
          <p className="text-sm text-muted-foreground dark:text-secondary-gray-50 mb-4">
            Invite your friends and get a bonus to use on any project.
          </p>
          <Button className="w-full bg-primary text-secondary-gray-50 text-sm hover:bg-primary/90 border-none" asChild>
            <Link href="/dashboard/getbonus">INVITE FRIENDS</Link>
          </Button>
        </div>
        <div className="w-32 h-32 relative">
          <Image
            src="/images/referral-illustration.svg"
            alt="Invite friends illustration"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </Card>
  );
} 