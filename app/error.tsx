'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <Button
        onClick={() => {
          window.location.reload();
        }}
        className='bg-primary dark:bg-secondary-gray-50 text-secondary-gray-50 dark:text-primary'
      >
        Try again
      </Button>
    </div>
  );
} 