'use client';

import { useEffect } from 'react';

import BackLink from '@/app/shared/backLink';

interface LoadingProps {
  agreement_id: string;
}

export function LoadingAgreement({ agreement_id }: LoadingProps) {
  useEffect(() => {
    document.title = 'Loading Agreement - SDE';
  });

  return (
    <>
      <BackLink href={`../${agreement_id}`} />
      <h1>Loading agreement {agreement_id}...</h1>
      <p>
        We are logging you into your agreement. Please wait, this process can
        take a few minutes.
      </p>
    </>
  );
}
