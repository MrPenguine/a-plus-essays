"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { useAuth } from "@/lib/firebase/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { parseAndValidateDate } from "@/lib/utils"
import { parseAndFormatDate, getTimeRemaining } from '@/lib/utils/date-utils';

interface Order {
  id: string
  title: string
  status: string
  deadline: string
  pages: number
  level: string
  subject: string
  createdAt: string
  userid: string
  amount?: number
  paymentStatus?: string
  assignment_type: string
  price: number
}

const truncateText = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + '...';
};

function formatDate(dateString: string) {
  try {
    const date = parseAndValidateDate(dateString);
    if (!date) return 'Invalid date';
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

function OrderSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex flex-col gap-2">
            <div className="space-y-2">
              <Skeleton className="h-6 w-full max-w-[250px]" />
              <Skeleton className="h-4 w-full max-w-[200px]" />
            </div>
            <div>
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-4 w-[120px] mt-2" />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-9 w-full max-w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface OrdersTableProps {
  filter?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  includePartial?: boolean;
  userId?: string;
}

export function OrdersTable({ filter, includePartial, userId }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [displayCount, setDisplayCount] = useState(5)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/fetch-orders${userId ? `?userId=${userId}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        
        // Filter orders based on props
        let filteredOrders = data.orders;
        
        if (filter) {
          filteredOrders = data.orders.filter((order: Order) => {
            if (filter === 'in_progress') {
              // Include orders with in_progress or partial status
              return order.status === 'in_progress' || order.status === 'partial';
            }
            return order.status === filter;
          });
        }

        // Sort orders by createdAt date (newest first)
        const sortedOrders = filteredOrders.sort((a: Order, b: Order) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, filter, includePartial, userId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return "bg-yellow-500 text-white"
      case 'in_progress':
        return "bg-blue-500 text-white"
      case 'completed':
        return "bg-green-500 text-white"
      case 'cancelled':
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus.toLowerCase();
    
    // If we have a filter prop, only show matching status
    if (filter) {
      if (filter === 'in_progress') {
        return matchesSearch && 
          (order.status === 'in_progress' || order.status === 'partial');
      }
      return matchesSearch && order.status === filter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const displayedOrders = filteredOrders.slice(0, displayCount);
  const hasMore = displayCount < filteredOrders.length;

  if (loading) {
    return <OrderSkeleton />;
  }

  return (
    <div className="w-full max-w-full">
      <div className="relative mb-6 px-2 sm:px-0">
        <Search className="absolute left-5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-10 w-full"
          placeholder="Search by project name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-nowrap overflow-x-auto pb-2 border-b border-secondary-gray-200 dark:border-secondary-gray-700/50 mb-6 gap-2 px-2 sm:px-0">
        {["All", "Pending", "in_progress", "Completed", "Cancelled"].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            onClick={() => setSelectedStatus(status)}
            className={`flex-shrink-0 text-sm ${
              selectedStatus === status 
                ? 'bg-primary text-white'
                : 'text-black dark:text-white'
            }`}
          >
            {status === "in_progress" ? "In Progress" : status}
          </Button>
        ))}
      </div>

      <div className="space-y-4 px-2 sm:px-0">
        {displayedOrders.map((order) => (
          <div 
            key={order.id}
            className="p-4 border dark:border-secondary-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-gray-800/70 cursor-pointer bg-gray-50 dark:bg-secondary-gray-800/30 backdrop-blur-sm"
            onClick={() => router.push(`/admin/projects/${order.id}`)}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start gap-2">
                  <h3 className="font-semibold text-base sm:text-lg text-primary-600 dark:text-white hover:text-primary-600 break-all max-w-full">
                    {truncateText(order.title, 20)}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(order.status)} whitespace-nowrap text-xs sm:text-sm`}
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-secondary-gray-500">
                  <span className="break-all">{order.assignment_type}</span>
                  <span>•</span>
                  <span className="break-all">{order.subject}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3">
                <div className="flex flex-col text-xs sm:text-sm text-secondary-gray-300">
                  <span className="break-words">Deadline: {parseAndFormatDate(order.deadline)}</span>
                  <span className="text-primary-600 dark:text-primary-400 mt-1 break-words">
                    {getTimeRemaining(order.deadline)}
                  </span>
                </div>
                <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-1">
                  <div className="font-semibold text-primary dark:text-white">${order.price}</div>
                  <div className="text-xs text-secondary-gray-500">ID: {order.id.slice(0, 8)}</div>
                </div>
              </div>

              <Button 
                variant="secondary" 
                className="w-full bg-primary text-white hover:bg-primary-600 text-sm sm:text-base py-2"
              >
                View Order
              </Button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center px-2 sm:px-0">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(prev => prev + 5)}
            className="gap-2 border-primary-200 rounded-full text-primary dark:text-white w-full sm:w-auto text-sm"
          >
            <ChevronDown className="h-4 w-4" />
            VIEW MORE
          </Button>
        </div>
      )}
    </div>
  )
}