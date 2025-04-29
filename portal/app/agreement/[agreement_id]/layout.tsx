import { Metadata } from 'next';
import React from 'react';

interface ManageUsersLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: 'SDE Portal',
};

export default async function ManageUsersLayout({
  children,
}: ManageUsersLayoutProps) {
  return <>{children}</>;
}
