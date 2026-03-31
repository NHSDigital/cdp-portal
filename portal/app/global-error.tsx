'use client';

import { useEffect } from 'react';

import UnexpectedError from './_components/unexpected-error/UnexpectedError';
import { LayoutWrapper } from './layout/LayoutWrapper';

interface GlobalErrorProps {
  error: Error & { digest?: string };
}

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    document.title = `Unexpected Error - ${document.title}`;
  }, [error]);

  return (
    <html lang='en'>
      <body>
        <LayoutWrapper>
          <UnexpectedError />
        </LayoutWrapper>
      </body>
    </html>
  );
}
