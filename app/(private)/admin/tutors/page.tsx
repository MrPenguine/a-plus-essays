"use client"

import { AdminPageLayout } from "@/components/admin/admin-page-layout"
import { TutorsGrid } from "@/components/admin/tutors-grid"

export default function AllTutorsPage() {
  return (
    <AdminPageLayout section="Admin Rules" page="Tutors">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">All Tutors</h2>
        </div>
        <div className="flex-1">
          <TutorsGrid />
        </div>
      </div>
    </AdminPageLayout>
  )
} 