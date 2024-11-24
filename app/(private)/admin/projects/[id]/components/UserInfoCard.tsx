import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface UserInfoCardProps {
  userid: string;
  tutorid?: string;
  tutorName?: string;
}

export function UserInfoCard({ userid, tutorid, tutorName }: UserInfoCardProps) {
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

    fetchUserEmail();
  }, [userid]);

  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <h2 className="text-lg font-semibold mb-4">User Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="font-medium break-all">{userid}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium break-all">{userEmail}</p>
          </div>
        </div>
        {tutorid && (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Tutor ID</p>
              <p className="font-medium break-all">{tutorid}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tutor Name</p>
              <p className="font-medium">{tutorName || 'Not available'}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 