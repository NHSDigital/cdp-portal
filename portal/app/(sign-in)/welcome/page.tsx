import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import React from 'react';

import { getWhiteLabelValues, WhiteLabelKey } from '@/config/whiteLabel';

import CDPContent from './_components/CDPContent';
import SDEContent from './_components/SDEContent';
import WelcomeButton from './_components/WelcomeButton';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Welcome to the NHS ${whiteLabelValues.longName} - ${whiteLabelValues.acronym}`,
  };
}

const welcomePageContentMap: Record<WhiteLabelKey, React.JSX.Element> = {
  SDE: <SDEContent />,
  CDP: <CDPContent />,
};

interface WelcomePageProps {
  searchParams?: { callbackUrl?: string | string[] };
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession();

  if (session) {
    let callbackUrl = resolvedSearchParams?.callbackUrl ?? '/';
    if (Array.isArray(callbackUrl)) callbackUrl = callbackUrl[0];
    redirect(callbackUrl);
  }

  const whiteLabelValues = getWhiteLabelValues();

  if (!(whiteLabelValues.acronym in welcomePageContentMap)) {
    throw new Error(
      `welcomPageContentMap entry missing: ${whiteLabelValues.acronym}`,
    );
  }

  return (
    <>
      {welcomePageContentMap[whiteLabelValues.acronym]}
      <WelcomeButton />
    </>
  );
}
