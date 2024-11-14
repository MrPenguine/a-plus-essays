import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";

interface OrderCardProps {
  order: {
    id: string;
    title: string;
    status: string;
    deadline: string;
    pages: number;
    level: string;
    subject: string;
    paymentStatus: string;
    createdAt: string;
    amount?: number;
  };
}

export default function OrderCard({ order }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer ">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg line-clamp-2">{order.title}</h3>
          <Badge variant="outline" className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-medium">#{order.id.slice(0, 8)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Level:</span>
            <span className="font-medium">{order.level}</span>
          </div>

          <div className="flex justify-between">
            <span>Pages:</span>
            <span className="font-medium">{order.pages}</span>
          </div>

          <div className="flex justify-between">
            <span>Subject:</span>
            <span className="font-medium">{order.subject}</span>
          </div>

          <div className="flex justify-between">
            <span>Deadline:</span>
            <span className="font-medium">
              {format(new Date(order.deadline), 'MMM dd, yyyy')}
            </span>
          </div>

          {order.amount && (
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">${order.amount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Created:</span>
            <span>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
} 