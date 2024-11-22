"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search } from "@/components/ui/search"
import { Input } from "@/components/ui/input"

interface Payment {
  id: string
  orderId: string
  amount: number
  createdAt: string
  paymentId: string
}

function PaymentSkeleton() {
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

export function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/admin/fetch-payments?page=${currentPage}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch payments')
        }

        const data = await response.json()
        setPayments(data.payments)
        setTotalPages(data.pagination.pages)
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [user, currentPage])

  if (loading) return <PaymentSkeleton />

  return (
    <div className="space-y-4">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-10"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:min-w-[100px]">Order</TableHead>
              <TableHead className="text-right md:min-w-[80px]">Amount</TableHead>
              <TableHead className="hidden md:table-cell min-w-[100px]">Payment ID</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow
                key={payment.id}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => router.push(`/admin/projects/${payment.orderId}`)}
              >
                <TableCell className="text-xs md:text-sm">
                  #{payment.orderId.slice(0, 6)}
                </TableCell>
                <TableCell className="text-right text-xs md:text-sm">
                  ${payment.amount.toFixed(2)}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono">
                  {payment.paymentId}
                </TableCell>
                <TableCell>
                  <span className="text-xs md:text-sm">
                    {format(new Date(payment.createdAt), 'MM/dd/yy')}
                  </span>
                  <span className="hidden md:inline">
                    {format(new Date(payment.createdAt), ' HH:mm')}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="h-8 px-2 text-xs md:text-sm"
        >
          <span className="md:hidden">←</span>
          <span className="hidden md:inline">Previous</span>
        </Button>
        <span className="text-xs md:text-sm px-2">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-8 px-2 text-xs md:text-sm"
        >
          <span className="md:hidden">→</span>
          <span className="hidden md:inline">Next</span>
        </Button>
      </div>
    </div>
  )
} 