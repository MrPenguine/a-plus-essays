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

interface User {
  uid: string
  email: string
  displayName: string
  orderCount: number
  createdAt: string
  lastSignIn: string
}

function UserSkeleton() {
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

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return

      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/admin/fetch-users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        setUsers(data.users)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user])

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <UserSkeleton />

  return (
    <div className="space-y-4">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          className="pl-10"
          placeholder="Search by email, name, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Last Sign In</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.uid}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => router.push(`/admin/users/${user.uid}`)}
              >
                <TableCell className="font-mono">{user.uid.slice(0, 8)}...</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{user.orderCount}</TableCell>
                <TableCell>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(new Date(user.lastSignIn), 'MMM dd, yyyy HH:mm')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 