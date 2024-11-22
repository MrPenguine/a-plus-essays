"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { UsersTable } from "@/components/admin/users-table"

export default function AllUsersPage() {
  return (
    <AdminPageLayout section="Users" page="All Users">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">All Users</h2>
        </div>
        <div className="flex-1">
          <UsersTable />
        </div>
      </div>
    </AdminPageLayout>
  )
} 