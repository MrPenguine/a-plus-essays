import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface BasicInfoCardProps {
  title: string;
  status: string;
  id: string;
  createdAt: string;
  userid: string;
}

export function BasicInfoCard({ title, status, id, createdAt, userid }: BasicInfoCardProps) {
  const [userEmail, setUserEmail] = useState<string>('Loading...');

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        // First try users collection
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', userid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          if (userData.email) {
            setUserEmail(userData.email);
            return;
          }
        }

        // If not found in users collection, try Firebase Auth
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user && user.uid === userid) {
            setUserEmail(user.email || 'No email found');
          } else {
            setUserEmail('No email found');
          }
        });

      } catch (error) {
        console.error('Error fetching user email:', error);
        setUserEmail('Error loading email');
      }
    };

    if (userid) {
      fetchUserEmail();
    }
  }, [userid]);

  return (
    <Card className="p-6 mb-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge className="mt-1">{status}</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Order ID</p>
          <p className="font-medium">{id}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created At</p>
          <p className="font-medium">{format(new Date(createdAt), "MMM d, yyyy h:mm a")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">User Email</p>
          <p className="font-medium">{userEmail}</p>
        </div>
      </div>
    </Card>
  );
} 