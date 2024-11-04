"use client";

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from './config';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Auth error:", error);
        setError(error);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return { user, loading, error };
} 