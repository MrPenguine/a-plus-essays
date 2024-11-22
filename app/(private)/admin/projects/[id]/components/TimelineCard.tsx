import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface TimelineCardProps {
  createdAt: string;
  updatedAt?: string;
}

export function TimelineCard({ createdAt, updatedAt }: TimelineCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Timeline</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="font-medium">
            {format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        {updatedAt && (
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium">
              {format(new Date(updatedAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 