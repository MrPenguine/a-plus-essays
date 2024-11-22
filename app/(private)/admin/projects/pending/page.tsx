"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { OrdersTable } from "@/components/admin/orders-table"

export default function PendingProjectsPage() {
  return (
    <AdminPageLayout section="Projects" page="Pending">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Pending Projects</h2>
        </div>
        <div className="flex-1">
          <OrdersTable filter="pending" />
        </div>
      </div>
    </AdminPageLayout>
  )
}
