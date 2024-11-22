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
  const [tutorEmail, setTutorEmail] = useState<string>('Loading...');

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

    const fetchTutorEmail = async () => {
      if (!tutorid) {
        setTutorEmail('Not assigned');
        return;
      }

      try {
        const tutorsRef = collection(db, 'tutors');
        const q = query(tutorsRef, where('tutorid', '==', tutorid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const tutorDoc = querySnapshot.docs[0];
          const tutorData = tutorDoc.data();
          setTutorEmail(tutorData.email || 'No email found');
        } else {
          setTutorEmail('No email found');
        }
      } catch (error) {
        console.error('Error fetching tutor email:', error);
        setTutorEmail('Error loading email');
      }
    };

    fetchUserEmail();
    if (tutorid) {
      fetchTutorEmail();
    }
  }, [userid, tutorid]);

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">User Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="font-medium">{userid}</p>
          <p className="text-sm text-muted-foreground mt-1">Email</p>
          <p className="font-medium">{userEmail}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tutor ID</p>
          <p className="font-medium">{tutorid || 'Not assigned'}</p>
          {tutorid && (
            <>
              <p className="text-sm text-muted-foreground mt-1">Tutor Email</p>
              <p className="font-medium">{tutorEmail}</p>
            </>
          )}
        </div>
        {tutorName && (
          <div>
            <p className="text-sm text-muted-foreground">Tutor Name</p>
            <p className="font-medium">{tutorName}</p>
          </div>
        )}
      </div>
    </Card>
  );
} 