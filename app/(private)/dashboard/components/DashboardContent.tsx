"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { Card } from "@/components/ui/card";
import { OrdersList } from "./OrdersList";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface OrderCounts {
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export default function DashboardContent() {
  const { user } = useAuth();
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    all: 0,
    pending: 0,
    in_progress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderCounts = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/fetch-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        const orders = data.orders || [];

        const counts = orders.reduce((acc: OrderCounts, order: any) => {
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
          }
          return acc;
        }, {
          all: 0,
          pending: 0,
          in_progress: 0,
          completed: 0
        });

        setOrderCounts(counts);
      } catch (error) {
        console.error('Error fetching order counts:', error);
        toast.error('Failed to load order statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCounts();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow order-2 lg:order-1">
          <OrdersList />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ 
            duration: 0.5,
            scale: {
              type: "spring",
              stiffness: 100
            }
          }}
        >
          <Card className="lg:w-72 p-4 h-fit order-1 lg:order-2 bg-gray-50 dark:bg-secondary-gray-800/30 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">My projects</h2>
          <div className="space-y-1">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">All</span>
              <span className="font-medium text-gray-700 dark:text-white">{orderCounts.all}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Pending</span>
              <span className="font-medium text-gray-700 dark:text-white">{orderCounts.pending}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">In progress</span>
              <span className="font-medium text-gray-700 dark:text-white">{orderCounts.in_progress}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
              <span className="font-medium text-gray-700 dark:text-white">{orderCounts.completed}</span>
            </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 