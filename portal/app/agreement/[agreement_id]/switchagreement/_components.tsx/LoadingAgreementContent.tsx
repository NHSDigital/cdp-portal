'use client';

import { useEffect } from 'react';

import BackLink from '@/app/shared/backLink';
import { WhiteLabelEntry } from '@/config/whiteLabel';

interface LoadingProps {
  agreement_id: string;
  whiteLabelValues: WhiteLabelEntry;
}

export function LoadingAgreement({
  agreement_id,
  whiteLabelValues,
}: LoadingProps) {
  useEffect(() => {
    document.title = `Loading agreement - ${whiteLabelValues.acronym}`;
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
