import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentId: string;
  userId: string;
  createdAt: string;
  status?: string;
}

interface PaymentsHistoryCardProps {
  payments: Payment[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  onDownloadReceipt: (payment: Payment) => void;
}

export function PaymentsHistoryCard({
  payments,
  currentPage,
  totalPages,
  setCurrentPage,
  onDownloadReceipt
}: PaymentsHistoryCardProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Payments History</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Payment ID</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments
            .slice((currentPage - 1) * 10, currentPage * 10)
            .map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {format(new Date(payment.createdAt), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell>{payment.paymentId}</TableCell>
                <TableCell className="text-right">
                  ${payment.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={payment.status === 'completed' ? 'bg-green-500 text-white border-none' : 'bg-yellow-500 text-white border-none'}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownloadReceipt(payment)}
                  >
                    Download Receipt
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {payments.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No payments found
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="py-2 px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
} 