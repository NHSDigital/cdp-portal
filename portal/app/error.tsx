'use client';

import { useEffect } from 'react';

import UnexpectedError from '@/app/_components/unexpected-error/UnexpectedError';

interface ErrorProps {
  error: Error & { digest?: string };
}

export default function Error({ error }: ErrorProps) {
  useEffect(() => {
    document.title = `Unexpected Error - ${document.title}`;
  }, [error]);

  return <UnexpectedError />;
}
