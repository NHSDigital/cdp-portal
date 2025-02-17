import React from "react";
import hasFeatureFlagEnabled from "../../../services/hasFeatureFlagEnabled";
import hasPermissions from "../../../services/hasPermissions";
import { notFound } from "next/navigation";
import Page403 from "../../../403";
import { USER_MANAGEMENT_FEATURE_FLAG } from "./consts";
import { getServerSession } from "next-auth";

const PERMISSIONS_REQUIRED = ["user_management.get_agreement_users"];

interface ManageUsersLayoutProps {
  children: React.ReactNode;
  params: { agreement_id: string };
}

export default async function ManageUsersLayout({
  children,
  params,
}: ManageUsersLayoutProps) {
  const { agreement_id } = params;

  const hasfeatureEnabled = await hasFeatureFlagEnabled({
    featureFlagName: USER_MANAGEMENT_FEATURE_FLAG,
  });

  if (!hasfeatureEnabled) notFound();

  const session = await getServerSession();
  const user_email = session?.user?.email;
  let userHasPermission;
  if (user_email) {
    userHasPermission = await hasPermissions({
      permissions_required: PERMISSIONS_REQUIRED,
      agreement_id: agreement_id,
      user_email: user_email,
    });
  } else {
    userHasPermission = false;
  }

  return userHasPermission ? <>{children}</> : <Page403 />;
}
