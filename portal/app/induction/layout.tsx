import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import { notFound } from 'next/navigation';
import React from 'react';

import { FeatureFlags } from '@/config/constants';

interface InductionLayoutProps {
  children: React.ReactNode;
}

export default async function InductionLayout({
  children,
}: InductionLayoutProps) {
  const hasfeatureEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.INDUCTION,
  });

  return hasfeatureEnabled ? <>{children}</> : notFound();
}
