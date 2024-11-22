"use client";

import { BidChat } from "@/components/admin/adminChat/bid";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { AdminContentLayout } from "@/components/admin/admin-content-layout";
import { useRouter } from 'next/navigation';

export default function BidChatsPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/admin/projects/all-projects');
  };

  return (
    <AdminPageLayout section="Chats" page="Bid Chats">
      <AdminContentLayout>
        <BidChat onClose={handleClose} />
      </AdminContentLayout>
    </AdminPageLayout>
  );
} 