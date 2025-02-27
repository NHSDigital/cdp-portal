import React from "react";
import { Metadata } from "next";

interface ManageUsersLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "SDE Portal",
};

export default async function ManageUsersLayout({
  children,
}: ManageUsersLayoutProps) {
  return <>{children}</>;
}
