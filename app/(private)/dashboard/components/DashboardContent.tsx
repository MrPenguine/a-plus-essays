"use client";

import { useState, useEffect } from "react";
import OrdersList from "./OrdersList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/firebase/hooks";
import { dbService } from "@/lib/firebase/db-service";

interface OrderCounts {
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export default function DashboardContent() {
  const [mounted, setMounted] = useState(false);
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    all: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch and count orders
  useEffect(() => {
    const fetchOrderCounts = async () => {
      if (!user?.uid) return;

      try {
        const orders = await dbService.getUserOrders(user.uid);
        
        const counts = orders.reduce((acc, order) => {
          acc.all++;
          switch (order.status) {
            case 'pending':
              acc.pending++;
              break;
            case 'in_progress':
              acc.in_progress++;
              break;
            case 'completed':
              acc.completed++;
              break;
            case 'cancelled':
              acc.cancelled++;
              break;
          }
          return acc;
        }, {
          all: 0,
          pending: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0
        } as OrderCounts);

        setOrderCounts(counts);
      } catch (error) {
        console.error("Error fetching order counts:", error);
      }
    };

    if (user) {
      fetchOrderCounts();
    }
  }, [user]);

  if (!mounted) return null;

  return (
    <div className="pt-[80px]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8">
          {/* Left Column - Orders List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Orders</h2>
            <OrdersList />
          </div>

          {/* Right Column - Projects Stats */}
          <div className="lg:sticky lg:top-[100px] lg:self-start">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">My projects</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 hover:bg-muted/50 rounded px-2">
                  <span className="text-sm text-muted-foreground">All</span>
                  <span className="text-sm font-medium">{orderCounts.all}</span>
                </div>
                <div className="flex items-center justify-between py-2 hover:bg-muted/50 rounded px-2">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-medium">{orderCounts.pending}</span>
                </div>
                <div className="flex items-center justify-between py-2 hover:bg-muted/50 rounded px-2">
                  <span className="text-sm text-muted-foreground">In progress</span>
                  <span className="text-sm font-medium">{orderCounts.in_progress}</span>
                </div>
                <div className="flex items-center justify-between py-2 hover:bg-muted/50 rounded px-2">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm font-medium">{orderCounts.completed}</span>
                </div>
                <div className="flex items-center justify-between py-2 hover:bg-muted/50 rounded px-2">
                  <span className="text-sm text-muted-foreground">Cancelled</span>
                  <span className="text-sm font-medium">{orderCounts.cancelled}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 