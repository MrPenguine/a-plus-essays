"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dbService } from "@/lib/firebase/db-service";
import { useAuth } from "@/lib/firebase/hooks";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Order {
  id: string;
  userid: string;
  title: string;
  status: string;
  deadline: string;
  subject: string;
  assignment_type: string;
  price: number;
  description: string;
  level: string;
  pages: number;
  wordcount: number;
  file_links: string[];
  createdAt: string;
}

function formatDeadline(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid date
    }
    return format(date, "PPP");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string if formatting fails
  }
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [displayCount, setDisplayCount] = useState(2); // Initial count
  const { user } = useAuth();
  const router = useRouter();

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const fetchedOrders = await dbService.getUserOrders(user.uid);
        if (Array.isArray(fetchedOrders)) {
          // Sort orders by creation date (most recent first)
          const sortedOrders = fetchedOrders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sortedOrders);
          setFilteredOrders(sortedOrders);
          setDisplayedOrders(sortedOrders.slice(0, displayCount));
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid, displayCount]);

  // Handle search and status filter
  useEffect(() => {
    const filtered = orders.filter(order => {
      const matchesSearch = !searchQuery.trim() || 
        order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.assignment_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    setFilteredOrders(filtered);
    setDisplayedOrders(filtered.slice(0, displayCount));
  }, [searchQuery, selectedStatus, orders, displayCount]);

  const handleShowMore = () => {
    const newCount = displayCount + (displayCount >= 5 ? 6 : 3);
    setDisplayCount(newCount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by project name, description, expert's name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filters */}
      <Tabs defaultValue="all" value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="flex w-full overflow-x-auto no-scrollbar">
          <TabsTrigger value="all" className="flex-1 min-w-fit px-3 text-sm md:text-base mr-auto">All</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 min-w-fit px-3 text-sm md:text-base">Pending</TabsTrigger>
          <TabsTrigger value="in_progress" className="flex-1 min-w-fit px-3 text-sm md:text-base">In Progress</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-fit px-3 text-sm md:text-base">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 min-w-fit px-3 text-sm md:text-base ml-auto">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders Display */}
      {!orders || orders.length === 0 ? (
        <Card className="relative overflow-hidden">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started
            </p>
            <Button 
              onClick={() => router.push('/createproject')}
              className="bg-primary hover:bg-primary/90 text-white dark:text-black"
            >
              Create Project
            </Button>
          </div>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="relative overflow-hidden">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or clear the search to see all orders
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Orders List */}
          <div className="space-y-4">
            {displayedOrders.map((order) => (
              <Card key={order.id} className="p-4">
                {/* Top Row: Deadline and Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-muted-foreground gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Deadline: {formatDeadline(order.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm">ID: {order.id.slice(0, 8)}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs sm:text-sm px-2 py-0.5 ${
                        order.status === 'completed' ? 'bg-green-500' :
                        order.status === 'in_progress' ? 'bg-blue-500' :
                        order.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Title Row with Price */}
                <div className="flex items-center justify-between mt-2">
                  <Link 
                    href={`/orders/${order.id}`}
                    className="text-base sm:text-lg font-medium text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {order.title}
                  </Link>
                  <span className="font-medium text-sm sm:text-base">${order.price.toFixed(2)}</span>
                </div>

                {/* Subject and Type Row */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                  <span>{order.subject}</span>
                  {order.subject && order.assignment_type && <span>•</span>}
                  <span>{order.assignment_type}</span>
                </div>

                {/* Action Button */}
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="bg-primary hover:bg-primary/90 text-white dark:text-black text-sm sm:text-base"
                  >
                    View Order
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Show More Button */}
          {displayedOrders.length < filteredOrders.length && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleShowMore}
                className="px-8"
              >
                Show More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 