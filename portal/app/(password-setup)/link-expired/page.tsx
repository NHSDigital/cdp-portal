import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CookieNames } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import LinkExpiredContent from './_components/LinkExpiredContent';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Link expired - ${whiteLabelValues.acronym}`,
  };
}

export default async function LinkExpiredPage() {
  const email = (await cookies()).get(CookieNames.CONFIRMED_EMAIL)?.value;

  if (!email) {
    redirect('/');
  }

  return <LinkExpiredContent email={email} />;
}
