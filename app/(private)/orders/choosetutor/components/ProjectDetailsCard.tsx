import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProjectDetailsCardProps {
  order: any; // Replace with proper order type
}

export function ProjectDetailsCard({ order }: ProjectDetailsCardProps) {
  if (!order) return null;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Project details</h2>
      
      <div className="space-y-4">
        <div>
          <Label>Subject Area</Label>
          <Input type="text" value={order.subject} readOnly />
        </div>

        <div>
          <Label>Project Type</Label>
          <Input type="text" value={order.assignment_type} readOnly />
        </div>

        <div>
          <Label>Deadline</Label>
          <Input type="text" value={order.deadline} readOnly />
        </div>

        <div>
          <Label>Number of words</Label>
          <Input type="text" value={`${order.wordcount || order.pages * 275} words`} readOnly />
        </div>

        <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
          EDIT DETAILS
        </Button>
      </div>
    </Card>
  );
} 