import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import { notFound } from 'next/navigation';
import React from 'react';

import { FeatureFlags } from '@/config/constants';

interface ManageUsersLayoutProps {
  children: React.ReactNode;
}

export default async function PasswordSetupLayout({
  children,
}: ManageUsersLayoutProps) {
  const hasfeatureEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.PASSWORD_SETUP_FLOW,
  });
  if (!hasfeatureEnabled) notFound();

  return <>{children}</>;
}
