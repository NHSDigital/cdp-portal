import { redirect } from 'next/navigation';
import React from 'react';

interface MaintenanceLayoutProps {
  children: React.ReactNode;
}

export default async function MaintenanceLayout({
  children,
}: MaintenanceLayoutProps) {
  if (process.env.MAINTENANCE_MODE != 'true') {
    redirect('/');
  }
  return <>{children}</>;
}
