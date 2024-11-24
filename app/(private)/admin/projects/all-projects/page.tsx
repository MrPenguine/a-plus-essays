"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { OrdersTable } from "@/components/admin/orders-table"

export default function AllProjectsPage() {
  return (
    <AdminPageLayout section="Projects" page="All Projects">
      <div className="flex-1 space-y-4 sm:space-y-6 p-2 sm:p-4 max-w-full overflow-hidden">
        <div className="flex justify-between items-center flex-wrap gap-2 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">All Projects</h2>
        </div>
        <div className="flex-1 w-full">
          <OrdersTable />
        </div>
      </div>
    </AdminPageLayout>
  )
}
