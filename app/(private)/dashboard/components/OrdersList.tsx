"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface Order {
  id: string;
  title: string;
  status: string;
  deadline: string;
  description: string;
  assignment_type: string;
  level: string;
  pages: number;
  price: number;
  subject: string;
  userid: string;
  wordcount: number;
  createdAt: string;
}

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 border rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-[80px] ml-auto" />
              <Skeleton className="h-4 w-[120px] mt-2" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-9 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/fetch-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const data = await response.json();
        setOrders(data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <OrderSkeleton />;
  }

  if (!loading && filteredOrders.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Orders</h2>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            className="pl-10"
            placeholder="Search by project name, description, expert's name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {["All", "Pending", "In Progress", "Completed", "Cancelled"].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              onClick={() => setSelectedStatus(status)}
              className="whitespace-nowrap"
            >
              {status}
            </Button>
          ))}
        </div>

        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No orders to show</p>
          <Button 
            onClick={() => router.push('/createproject')}
            className="mx-auto"
          >
            Create Order
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'yellow';
      case 'in_progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Your Orders</h2>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-10"
          placeholder="Search by project name, description, expert's name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {["All", "Pending", "In Progress", "Completed", "Cancelled"].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            onClick={() => setSelectedStatus(status)}
            className="whitespace-nowrap"
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div 
            key={order.id}
            className="p-4 sm:p-6 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => router.push(`/orders/${order.id}`)}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{order.title}</h3>
                  <Badge 
                    variant="outline" 
                    className={`bg-${getStatusColor(order.status)}-50 text-${getStatusColor(order.status)}-700 border-${getStatusColor(order.status)}-200`}
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span>{order.assignment_type}</span>
                  <span>•</span>
                  <span>{order.subject}</span>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <div className="font-semibold">${order.price}</div>
                <div className="text-sm text-gray-500">ID: {order.id}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-sm text-gray-600">
                Deadline: {new Date(order.deadline).toLocaleDateString()}
              </div>
              <Button variant="secondary" className="w-full sm:w-auto">View Order</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 