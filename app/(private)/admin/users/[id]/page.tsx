"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { useAuth } from "@/lib/firebase/hooks";
import { ArrowLeft } from "lucide-react";
import Loading from "@/app/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserOrders } from "@/components/admin/user-orders";
import { Input } from "@/components/ui/input";
import { parseAndFormatDate } from '@/lib/utils/date-utils';

interface UserDetail {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastSignIn: string;
  orderCount: number;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (!user || !params.id) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/fetch-user-detail?userId=${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        setUserDetail(data.user);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [user, params.id]);

  const handleDeleteUser = async () => {
    if (!user || !params.id) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/delete-user?userId=${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = async () => {
    if (!user || !params.id) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/edit-user?userId=${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setUserDetail(prev => prev ? {
        ...prev,
        displayName: editForm.displayName,
        email: editForm.email
      } : null);

      setIsEditing(false);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleStartEdit = () => {
    setEditForm({
      displayName: userDetail?.displayName || '',
      email: userDetail?.email || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      displayName: userDetail?.displayName || '',
      email: userDetail?.email || ''
    });
  };

  if (loading) return <Loading />;
  if (!userDetail) return <div>User not found</div>;

  return (
    <AdminPageLayout section="Users" page="User Details">
      <div className="min-w-0 max-w-full space-y-4 md:space-y-6 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 min-w-0">
          <button 
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-2 text-sm text-muted-foreground shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditUser}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </>
            ) : isDeleting ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleting(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Delete
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={handleStartEdit}
                  className="w-full sm:w-auto"
                >
                  Edit User
                </Button>
                <Button 
                  onClick={() => setIsDeleting(true)}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete User
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="p-4 md:p-6 w-full min-w-0">
          <div className="space-y-4 w-full min-w-0">
            {isDeleting ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-red-600">Delete User</h2>
                <p className="text-sm text-muted-foreground break-words">
                  Are you sure you want to delete this user? This action cannot be undone. 
                  This will permanently delete the user and all associated data including orders and messages.
                </p>
              </div>
            ) : isEditing ? (
              <div className="space-y-2 w-full min-w-0">
                <p className="text-sm text-gray-500">Display Name</p>
                <Input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    displayName: e.target.value
                  }))}
                  placeholder="Enter display name"
                  className="w-full"
                />
              </div>
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold break-words min-w-0">{userDetail.displayName || 'No Name'}</h2>
            )}

            <div className="grid gap-4 sm:grid-cols-2 w-full min-w-0">
              {isEditing ? (
                <div className="space-y-2 w-full min-w-0">
                  <p className="text-sm text-gray-500">Email</p>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    placeholder="Enter email"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="space-y-1 min-w-0">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="break-words truncate">{userDetail.email}</p>
                </div>
              )}
              
              <div className="space-y-1 min-w-0">
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-mono text-sm break-all truncate">{userDetail.uid}</p>
              </div>
              
              <div className="space-y-1 min-w-0">
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-sm truncate">{parseAndFormatDate(userDetail.createdAt)}</p>
              </div>
              
              <div className="space-y-1 min-w-0">
                <p className="text-sm text-gray-500">Last Sign In</p>
                <p className="text-sm truncate">{parseAndFormatDate(userDetail.lastSignIn)}</p>
              </div>
              
              <div className="space-y-1 min-w-0">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-sm">{userDetail.orderCount}</p>
              </div>
            </div>
          </div>
        </Card>

        {!isDeleting && (
          <div className="space-y-4 w-full min-w-0">
            <h3 className="text-lg font-semibold">User Orders</h3>
            <div className="w-full">
              <UserOrders 
                userId={params.id as string} 
                totalOrders={userDetail.orderCount} 
              />
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
} 