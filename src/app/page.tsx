'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/fp-calculator');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting to Function Point Calculator...</p>
    </div>
  );
}
