import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import parseInductionCookie from '../_components/inductionCookie';
import InductionPassedPageContent from './_components/inductionPassedPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Assessment passed - ${whiteLabelValues.acronym}`,
  };
}

export default async function InductionPassedPage() {
  const { cookie_passed } = await parseInductionCookie();

  if (cookie_passed != true) redirect('/');

  return <InductionPassedPageContent />;
}
