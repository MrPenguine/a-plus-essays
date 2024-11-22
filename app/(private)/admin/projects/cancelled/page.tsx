"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { OrdersTable } from "@/components/admin/orders-table"

export default function CancelledProjectsPage() {
  return (
    <AdminPageLayout section="Projects" page="Cancelled">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Cancelled Projects</h2>
        </div>
        <div className="flex-1">
          <OrdersTable filter="cancelled" />
        </div>
      </div>
    </AdminPageLayout>
  )
} 