import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { AdminContentLayout } from "@/components/admin/admin-content-layout"

export default function PendingPaymentsPage() {
  return (
    <AdminPageLayout section="Payments" page="Pending">
      <AdminContentLayout />
    </AdminPageLayout>
  )
} 