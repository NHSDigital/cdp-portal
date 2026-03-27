import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import ConfirmEmailAddressPageContent from './_components/ConfirmEmailAddressContent';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Confirm email address - ${whiteLabelValues.acronym}`,
  };
}

interface ConfirmEmailAddressPageProps {
  searchParams: { id?: string };
}

export default function ConfirmEmailAddressPage({
  searchParams: { id },
}: ConfirmEmailAddressPageProps) {
  if (!id || typeof id != 'string') {
    redirect('/');
  }

  return id && <ConfirmEmailAddressPageContent id={id} />;
}
