import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { AdminContentLayout } from "@/components/admin/admin-content-layout"

export default function PaymentsPage() {
  return (
    <AdminPageLayout section="Payments" page="Overview">
      <AdminContentLayout />
    </AdminPageLayout>
  )
}
