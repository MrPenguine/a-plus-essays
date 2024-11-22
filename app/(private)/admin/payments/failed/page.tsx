import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { AdminContentLayout } from "@/components/admin/admin-content-layout"

export default function FailedPaymentsPage() {
  return (
    <AdminPageLayout section="Payments" page="Failed">
      <AdminContentLayout />
    </AdminPageLayout>
  )
} 