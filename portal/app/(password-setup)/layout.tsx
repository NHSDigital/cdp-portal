import React from "react";
import { notFound } from "next/navigation";
import hasFeatureFlagEnabled from "app/services/hasFeatureFlagEnabled";
import { FeatureFlags } from "types/enums";

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
