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
import { FaChevronDown } from "react-icons/fa";

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

const truncateText = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + '...';
};

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
  const [displayCount, setDisplayCount] = useState(3);
  const [hasMore, setHasMore] = useState(true);

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

  const displayedOrders = filteredOrders.slice(0, displayCount);

  const handleLoadMore = () => {
    const newDisplayCount = displayCount + 3;
    setDisplayCount(newDisplayCount);
    setHasMore(newDisplayCount < filteredOrders.length);
  };

  if (loading) {
    return <OrderSkeleton />;
  }

  if (!loading && filteredOrders.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-black dark:text-white">Your Orders</h2>
        
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
          {["All", "Pending", "in_progress", "Completed", "Cancelled"].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              onClick={() => setSelectedStatus(status)}
              className={`whitespace-nowrap ${
                selectedStatus === status 
                  ? 'bg-primary text-white'
                  : 'text-black dark:text-white'
              }`}
            >
              {status === "in_progress" ? "In Progress" : status}
            </Button>
          ))}
        </div>

        <Card className="p-8 text-center">
          <p className="text-secondary-gray-500 dark:text-secondary-gray-200 mb-4">No orders to show</p>
          <Button 
            onClick={() => router.push('/createproject')}
            className="mx-auto bg-primary text-white hover:bg-primary-600"
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
        return 'bg-warning text-secondary-gray-900 border-warning';
      case 'in_progress':
        return 'bg-primary-100 text-primary border-primary-200';
      case 'completed':
        return 'bg-success text-white border-success';
      case 'cancelled':
        return 'bg-error text-white border-error';
      default:
        return 'bg-secondary-gray-200 text-secondary-gray-600 border-secondary-gray-300';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-black dark:text-white">Your Orders</h2>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-10"
          placeholder="Search by project name, description, expert's name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-secondary-gray-200 dark:border-secondary-gray-700/50 mb-6">
        {["All", "Pending", "in_progress", "Completed", "Cancelled"].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            onClick={() => setSelectedStatus(status)}
            className={`whitespace-nowrap ${
              selectedStatus === status 
                ? 'bg-primary text-white'
                : 'text-black dark:text-white'
            }`}
          >
            {status === "in_progress" ? "In Progress" : status}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {displayedOrders.map((order) => (
          <div 
            key={order.id}
            className="p-4 sm:p-6 border dark:border-secondary-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-gray-800/70 cursor-pointer bg-gray-50 dark:bg-secondary-gray-800/30 backdrop-blur-sm"
            onClick={() => router.push(`/orders/${order.id}`)}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-primary-600 dark:text-white hover:text-primary-600">
                    {truncateText(order.title, 20)}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(order.status)}
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-secondary-gray-500">
                  <span>{order.assignment_type}</span>
                  <span>•</span>
                  <span>{order.subject}</span>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <div className="font-semibold text-primary dark:text-white">${order.price}</div>
                <div className="text-sm text-secondary-gray-500">ID: {order.id}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-sm text-secondary-gray-300">
                Deadline: {new Date(order.deadline).toLocaleDateString()}
              </div>
              <Button variant="secondary" className="w-full sm:w-auto bg-primary text-white hover:bg-primary-600">View Order</Button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="gap-2 border-primary-200 rounded-full text-primary dark:text-white"
          >
            <FaChevronDown
            />
            VIEW MORE
          </Button>
        </div>
      )}
    </div>
  );
} 