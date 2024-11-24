"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  title: string
  status: string
  deadline: string
  createdAt: string
  price: number
}

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="space-y-3">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface UserOrdersProps {
  userId: string;
  totalOrders: number;
}

export function UserOrders({ userId, totalOrders }: UserOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/admin/fetch-user-orders?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user orders')
        }

        const data = await response.json()
        
        if (data.orders.length !== totalOrders) {
          console.warn(`Expected ${totalOrders} orders but got ${data.orders.length}`)
        }

        setOrders(data.orders)
      } catch (error) {
        console.error('Error fetching user orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, userId, totalOrders])

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

  const filteredOrders = orders.filter(order => 
    order.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <OrderSkeleton />

  return (
    <div className="space-y-4">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-10"
          placeholder="Search by order title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Order ID</TableHead>
              <TableHead className="whitespace-nowrap">Title</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Price</TableHead>
              <TableHead className="whitespace-nowrap">Deadline</TableHead>
              <TableHead className="whitespace-nowrap">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => router.push(`/admin/projects/${order.id}`)}
              >
                <TableCell className="font-mono whitespace-nowrap">{order.id.slice(0, 8)}...</TableCell>
                <TableCell className="max-w-[200px] truncate">{order.title}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">${order.price}</TableCell>
                <TableCell className="whitespace-nowrap">{format(new Date(order.deadline), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="whitespace-nowrap">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}