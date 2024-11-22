"use client"

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/hooks";
import { toast } from "sonner";

interface PaymentDetailsCardProps {
  id: string; // Add order ID
  originalPrice: number;
  price: number;
  amount_paid: number;
  paymentStatus: string;
  discountAmount?: number;
  additionalPaymentNeeded?: number;
  onUpdate?: () => void;
}

export function PaymentDetailsCard({
  id,
  originalPrice,
  price,
  amount_paid,
  paymentStatus,
  discountAmount,
  additionalPaymentNeeded,
  onUpdate
}: PaymentDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(price.toString());
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/edit-order?orderId=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price: Number(newPrice)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update price');
      }

      toast.success('Price updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Payment Information</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNewPrice(price.toString());
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Price
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Original Price</p>
          <p className="font-medium">${originalPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Price</p>
          {isEditing ? (
            <Input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="mt-1"
            />
          ) : (
            <p className="font-medium">${price.toFixed(2)}</p>
          )}
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