"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { PaymentsTable } from "@/components/admin/payments-table"
import { PaymentsChart } from "@/components/admin/payments-chart"
import { useEffect, useState } from "react"

export default function AllPaymentsPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <AdminPageLayout section="Payments" page="All Payments">
      <div className="flex-1 space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-bold tracking-tight">All Payments</h2>
        </div>
        
        {/* Only show chart on desktop */}
        {!isMobile && (
          <div className="w-full">
            <PaymentsChart />
          </div>
        )}

        {/* Table Container */}
        <div className="w-full">
          <PaymentsTable />
        </div>
      </div>
    </AdminPageLayout>
  )
} 