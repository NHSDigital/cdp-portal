import queryPermissionsService from "./queryPermissionsService";

interface hasPermissionProps {
  permissions_required: string[];
  agreement_id?: string;
  user_email: string;
  target_user?: string;
}

export default async function hasPermissions({
  permissions_required,
  agreement_id,
  user_email,
  target_user,
}: hasPermissionProps): Promise<boolean> {
  const permissionServicePromises = permissions_required.map((permission) =>
    queryPermissionsService({
      user_email: user_email,
      action: permission,
      dsa: agreement_id,
      target_user: target_user,
    })
  );

  const permissionServiceResponses = await Promise.all(
    permissionServicePromises
  );

  const hasPermission = permissionServiceResponses.every(
    (permissionServiceResponse) => {
      if (permissionServiceResponse.status !== 200) return false;
      if (permissionServiceResponse.outcome === "deny") return false;
      return true;
    }
  );

  return hasPermission;
}
