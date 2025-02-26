"use server";

import { redirect } from "next/navigation";
import { logAndError } from "app/shared/common";
import { getLoggerAndSession } from "app/shared/logging";
import { cookies } from "next/headers";
import hasPermissions from "app/services/hasPermissions";
import { ADDING_USER_PERMISSIONS_REQUIRED } from "../../../consts";
import getAgreementUserDetails from "app/services/getAgreementUserDetails";
import callLambdaWithFullErrorChecking from "app/shared/callLambda";
import { Logger } from "pino";

const LOGGER_NAME = "changeUserRole";

interface ChangeUserRole {
  agreement_id: string;
  user_to_change_email: string;
  new_role: string;
}

export default async function changeUserRole(
  { agreement_id, user_to_change_email }: ChangeUserRole,
  initial_state: any,
  form_data: FormData
) {
  let { logger, session } = await getLoggerAndSession(LOGGER_NAME);

  try {
    let requested_role = form_data.get("role");
    requested_role = typeof requested_role === "string" ? requested_role : null;

    const child_logger = logger.child({
      user_to_change_role: {
        user_email: user_to_change_email,
        new_role: requested_role,
        agreement_id,
      },
    });

    child_logger.info("Change user role requested.");

    child_logger.info("Starting change user role process");

    const userHasPermission = await hasPermissions({
      permissions_required: ADDING_USER_PERMISSIONS_REQUIRED,
      agreement_id,
      user_email: session.user.email,
      target_user: user_to_change_email,
    });

    if (!userHasPermission) {
      logAndError(
        child_logger,
        "Requesting user does not have permission to change user role"
      );
    }

    const user_to_change_details = await getAgreementUserDetails(
      agreement_id,
      user_to_change_email
    );

    const valid_roles = ["UserManager", "Analyst", "Both"];

    if (!requested_role || !valid_roles.includes(requested_role)) {
      child_logger.info("Requested role is not valid. Unable to change role.");
      return {
        error: "Select a role",
      };
    }

    const users_current_roles =
      user_to_change_details.application_roles_agreement;

    if (!users_current_roles) {
      logAndError(
        child_logger,
        "Couldn't get user's current roles. Unable to change role."
      );
    }

    let role_changes = PlanRoleChanges({
      requested_role,
      users_current_roles,
    });

    child_logger.info({ role_changes }, "Role changes");

    await ApplyRoleChanges({
      user_email: user_to_change_email,
      agreement_id: agreement_id,
      fleet_type: user_to_change_details.fleet_type,
      role_changes,
      logger: child_logger,
    });
    child_logger.info("Change user role success.");

    cookies().set(
      "manage_users_success_message",
      `${user_to_change_details.first_name} ${user_to_change_details.last_name}'s role has been changed to ${role_changes["confirmation_of_role"]}.`,
      { expires: Date.now() + 30 * 1000 }
    );
  } catch (err) {
    logger.error(err);
    throw new Error("Something went wrong");
  }
  redirect(
    `/agreement/${agreement_id}/manage-users/user/${user_to_change_email}`
  );
}

interface ApplyRoleChanges {
  user_email: string;
  agreement_id: string;
  fleet_type: string | undefined;
  role_changes: { [key: string]: any };
  logger: Logger;
}

async function ApplyRoleChanges({
  user_email,
  agreement_id,
  fleet_type: previous_fleet_type,
  role_changes,
  logger,
}: ApplyRoleChanges) {
  const remove_role = role_changes["remove_role"] ?? null;
  const new_role = role_changes["new_role"] ?? null;
  const email_type = "ROLE_CHANGE";
  const fleet_type =
    previous_fleet_type ||
    (agreement_id == "review_file" ? "review_file" : "default");

  if (remove_role) {
    await callLambdaWithFullErrorChecking({
      function_name: process.env
        .REMOVE_ROLE_FROM_USER_IN_AGREEMENT_ARN as string,
      raw_payload: {
        user_email: user_email,
        agreement_id: agreement_id,
        role_name: changeAnalystToBasicAgreementAccessIfAgreementIsReviewFile(
          remove_role,
          agreement_id
        ),
        email_type: email_type,
        fleet_type: fleet_type,
      },
      logger,
      log_result: true,
    });
  }

  if (new_role) {
    await callLambdaWithFullErrorChecking({
      function_name: process.env.ADD_ROLE_TO_USER_IN_AGREEMENT_ARN as string,
      raw_payload: {
        user_email: user_email,
        agreement_id,
        role_name: changeAnalystToBasicAgreementAccessIfAgreementIsReviewFile(
          new_role,
          agreement_id
        ),
        email_type: email_type,
        fleet_type: fleet_type,
      },
      logger,
      log_result: true,
    });
  }
}

function changeAnalystToBasicAgreementAccessIfAgreementIsReviewFile(
  role_name: string,
  agreement_id: string
) {
  if (role_name === "Analyst" && agreement_id === "review_file") {
    return "BasicAgreementAccess";
  }
  return role_name;
}

interface PlanRoleChanges {
  requested_role: string;
  users_current_roles: string[];
}

function PlanRoleChanges({
  requested_role,
  users_current_roles,
}: PlanRoleChanges) {
  let new_role: string | null = null;
  let remove_role: string | null = null;
  let confirmation_of_role: string = "";

  const hasUserManager = users_current_roles.includes("UserManager");
  const hasAnalyst = users_current_roles.includes("Analyst");

  switch (requested_role) {
    case "Both":
      if (!hasAnalyst) {
        new_role = "Analyst";
      }
      if (!hasUserManager) {
        new_role = "UserManager";
      }
      confirmation_of_role = "both Analyst and User Manager";
      break;

    case "Analyst":
      if (hasUserManager) {
        remove_role = "UserManager";
      }
      if (!hasAnalyst) {
        new_role = "Analyst";
      }
      confirmation_of_role = "Analyst";
      break;

    case "UserManager":
      if (hasAnalyst) {
        remove_role = "Analyst";
      }
      if (!hasUserManager) {
        new_role = "UserManager";
      }
      confirmation_of_role = "User Manager";
      break;
  }

  return {
    new_role,
    remove_role,
    confirmation_of_role,
  };
}
