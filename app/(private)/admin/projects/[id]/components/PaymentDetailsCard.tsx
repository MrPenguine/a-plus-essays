import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaymentDetailsCardProps {
  originalPrice: number;
  price: number;
  amount_paid: number;
  paymentStatus: string;
  discountAmount?: number;
  additionalPaymentNeeded?: number;
}

export function PaymentDetailsCard({
  originalPrice,
  price,
  amount_paid,
  paymentStatus,
  discountAmount,
  additionalPaymentNeeded
}: PaymentDetailsCardProps) {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Original Price</p>
          <p className="font-medium">${originalPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Price</p>
          <p className="font-medium">${price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Amount Paid</p>
          <p className="font-medium">${amount_paid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Payment Status</p>
          <Badge 
            className={
              paymentStatus === 'completed' ? 'bg-green-500' : 
              paymentStatus === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
            }
          >
            {paymentStatus}
          </Badge>
        </div>
        {discountAmount && (
          <div>
            <p className="text-sm text-muted-foreground">Discount Applied</p>
            <p className="font-medium">${discountAmount.toFixed(2)}</p>
          </div>
        )}
        {additionalPaymentNeeded && additionalPaymentNeeded > 0 && (
          <div>
            <p className="text-sm text-muted-foreground">Additional Payment Needed</p>
            <p className="font-medium text-red-500">${additionalPaymentNeeded.toFixed(2)}</p>
          </div>
        )}
      </div>
    </Card>
  );
} 