"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { OrdersTable } from "@/components/admin/orders-table"

export default function InProgressProjectsPage() {
  return (
    <AdminPageLayout section="Projects" page="In Progress">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">In Progress Projects</h2>
        </div>
        <div className="flex-1">
          <OrdersTable 
            filter="in_progress" 
            includePartial={true} // Include orders with partial payment status
          />
        </div>
      </div>
    </AdminPageLayout>
  )
} 