import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface ProjectDetailsCardProps {
  order: any; // Replace with proper order type
}
export function ProjectDetailsCard({ order }: ProjectDetailsCardProps) {
  if (!order) return null;

  return (
    <Card className="p-6 border-primary-50 dark:border-primary-100">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-secondary-gray-50">Project details</h2>
      
      <div className="space-y-4">
        <div>
          <Label className="text-gray-700 dark:text-secondary-gray-50">Subject Area</Label>
          <Input type="text" className="dark:text-secondary-gray-200" value={order.subject} readOnly />
        </div>

        <div>
          <Label className="text-gray-700 dark:text-secondary-gray-50">Project Type</Label>
          <Input type="text" className="dark:text-secondary-gray-200" value={order.assignment_type} readOnly />
        </div>

        <div>
          <Label className="text-gray-700 dark:text-secondary-gray-50">Deadline</Label>
          <Input type="text" className="dark:text-secondary-gray-200" value={order.deadline} readOnly />
        </div>

        <div>
          <Label className="text-gray-700 dark:text-secondary-gray-50">Number of words</Label>
          <Input type="text" className="dark:text-secondary-gray-200 dark:border-secondary-gray-300" value={`${order.wordcount || order.pages * 275} words`} readOnly />
        </div>
        <br />
        <Link href={`/orders/${order.id}`}>
          <Button variant="outline" className="w-full bg-primary text-secondary-gray-50 text-sm hover:bg-primary/90 border-none">
            EDIT DETAILS
          </Button>
        </Link>
      </div>
    </Card>
  );
} 