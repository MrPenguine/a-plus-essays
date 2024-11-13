import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function InviteFriendsCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Get $20 off for being a good friend!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Invite your friends and get a bonus to use on any project.
          </p>
          <Button className="w-full" asChild>
            <Link href="/dashboard/getbonus">INVITE FRIENDS</Link>
          </Button>
        </div>
        <div className="w-32 h-32 relative">
          <Image
            src="/images/invite-friends.png"
            alt="Invite friends illustration"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </Card>
  );
} 