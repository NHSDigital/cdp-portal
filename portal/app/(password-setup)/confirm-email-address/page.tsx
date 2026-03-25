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
  searchParams: Promise<{ id?: string }>;
}

export default async function ConfirmEmailAddressPage({
  searchParams,
}: ConfirmEmailAddressPageProps) {
  const { id } = await searchParams;
  if (!id || typeof id != 'string') {
    redirect('/');
  }

  return id && <ConfirmEmailAddressPageContent id={id} />;
}
