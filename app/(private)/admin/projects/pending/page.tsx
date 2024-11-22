import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { AdminContentLayout } from "@/components/admin/admin-content-layout"

export default function PendingProjectsPage() {
  return (
    <AdminPageLayout section="Projects" page="Pending">
      <AdminContentLayout />
    </AdminPageLayout>
  )
}
