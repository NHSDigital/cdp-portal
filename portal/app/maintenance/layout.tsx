import React from "react";
import { redirect } from "next/navigation";

interface MaintenanceLayoutProps {
  children: React.ReactNode;
}

export default async function MaintenanceLayout({
  children,
}: MaintenanceLayoutProps) {
  if (process.env.MAINTENANCE_MODE != "true") {
    redirect("/");
  }
  return <>{children}</>;
}
