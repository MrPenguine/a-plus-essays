import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function InviteFriends() {
  return (
    <Card className="p-4">
      <div className="flex flex-col items-center text-center">

        <h3 className="text-lg font-semibold mb-1">
          Get $20 off for being a good friend!
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Invite your friends to Studybay and get a bonus to use on any project.
        </p>
        <Button className="w-full bg-primary hover:bg-primary/90" asChild>
          <Link href="/dashboard/getbonus">
            INVITE FRIENDS
          </Link>
        </Button>
      </div>
    </Card>
  );
}
