"use client";

import { ActiveChat } from "@/components/admin/adminChat/active";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { AdminContentLayout } from "@/components/admin/admin-content-layout";
import { useRouter } from 'next/navigation';

export default function ActiveChatsPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/admin/projects/all-projects');
  };

  return (
    <AdminPageLayout section="Chats" page="Active Chats">
      <AdminContentLayout>
        <ActiveChat onClose={handleClose} />
      </AdminContentLayout>
    </AdminPageLayout>
  );
}