import React from "react";
import hasPermissions from "app/services/hasPermissions";
import Page403 from "app/403";
import { getServerSessionErrorIfMissingProperties } from "app/shared/common";
import { getLogger } from "helpers/logging/logger";
import { VIEW_USER_DETAILS_PERMISSIONS_REQUIRED } from "../../consts";

const rootLogger = getLogger("userDetailsLayout");

interface UserDetailsLayout {
  children: React.ReactNode;
  params: { agreement_id: string; user: string };
}

export default async function UserDetailsLayout({
  children,
  params,
}: UserDetailsLayout) {
  const { agreement_id, user } = params;
  const user_to_change = decodeURIComponent(user);

  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const user_email = session.user.email;
  let userHasPermission;
  userHasPermission = await hasPermissions({
    permissions_required: VIEW_USER_DETAILS_PERMISSIONS_REQUIRED,
    agreement_id: agreement_id,
    user_email: user_email,
    target_user: user_to_change,
  });

  return userHasPermission ? <>{children}</> : <Page403 />;
}
