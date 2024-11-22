"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { OrdersTable } from "@/components/admin/orders-table"

export default function CompletedProjectsPage() {
  return (
    <AdminPageLayout section="Projects" page="Completed">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Completed Projects</h2>
        </div>
        <div className="flex-1">
          <OrdersTable filter="completed" />
        </div>
      </div>
    </AdminPageLayout>
  )
} 