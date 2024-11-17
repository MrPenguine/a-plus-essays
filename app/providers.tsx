"use client";

import { useAbandonedCartEmail } from '@/hooks/useAbandonedCartEmail';
import { useEffect } from 'react';
import { useAuth } from '@/lib/firebase/hooks';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      console.log('Providers mounted with user:', user.uid);
    }
  }, [user]);

  useAbandonedCartEmail();
  
  return <>{children}</>;
} 