"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { OrdersTable } from "@/components/admin/orders-table"

export default function AllProjectsPage() {
  return (
    <AdminPageLayout section="Projects" page="All Projects">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">All Projects</h2>
        </div>
        <div className="flex-1">
          <OrdersTable />
        </div>
      </div>
    </AdminPageLayout>
  )
}
