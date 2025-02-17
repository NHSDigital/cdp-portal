import React from "react";
import hasFeatureFlagEnabled from "app/services/hasFeatureFlagEnabled";
import { notFound } from "next/navigation";
import { INDUCTION_FEATURE_FLAG } from "./consts";

interface InductionLayoutProps {
  children: React.ReactNode;
}

export default async function InductionLayout({
  children,
}: InductionLayoutProps) {
  const hasfeatureEnabled = await hasFeatureFlagEnabled({
    featureFlagName: INDUCTION_FEATURE_FLAG,
  });

  return hasfeatureEnabled ? <>{children}</> : notFound();
}
