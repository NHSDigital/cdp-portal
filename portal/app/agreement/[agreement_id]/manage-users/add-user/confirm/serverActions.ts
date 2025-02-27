"use server";

import hasFeatureFlagEnabled from "app/services/hasFeatureFlagEnabled";
import {
  ADDING_USER_PERMISSIONS_REQUIRED,
  USER_MANAGEMENT_FEATURE_FLAG,
} from "../../consts";
import hasPermissions from "app/services/hasPermissions";
import { Logger } from "pino";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import callLambdaWithFullErrorChecking from "app/shared/callLambda";
import { logAndError } from "app/shared/common";
import { getLoggerAndSession } from "app/shared/logging";

const LOGGER_NAME = "createUser";

// Not all agreements have UC Account level group created
// For such agreements, skip calling the UC Add User Lambda
const AGREEMENTS_TO_SKIP_DATABRICKS: string[] = ["review_file"];

export async function createOneUserServerActionNoJS(
  agreement_id: string,
  previous_state: any,
  form_data: FormData
) {
  const { logger } = await getLoggerAndSession(LOGGER_NAME);
  const user_to_add_email = form_data.get("email") as string;
  const user_to_add_role = form_data.get("role") as string;
  const first_name = form_data.get("first_name") as string;
  const last_name = form_data.get("last_name") as string;
  const final_confirm = form_data.get("final_confirm");

  if (!final_confirm) {
    return { error: "You must confirm that these details are correct" };
  }

  try {
    await createOneUserCommon(
      agreement_id,
      user_to_add_email,
      user_to_add_role,
      first_name,
      last_name
    );

    const cookie_store = cookies();
    cookie_store.set(
      "manage_users_success_message",
      `${form_data.get("first_name")} ${form_data.get(
        "last_name"
      )} added successfully`,
      { expires: Date.now() + 30 * 1000 }
    );
    cookie_store.set("add_user_form", "", { maxAge: 0 }); // expire the add user form cookie

    redirect(`/agreement/${agreement_id}/manage-users`);
  } catch (error) {
    logger.error(error);
    return { error: "UNEXPECTED_ERROR" };
  }
}

export async function createOneUserCommon(
  agreement_id: string,
  user_to_add_email: string,
  user_to_add_role: string,
  first_name: string,
  last_name: string
) {
  const { logger, session } = await getLoggerAndSession(LOGGER_NAME, {
    user_to_add: {
      user_email: user_to_add_email,
      role: user_to_add_role,
      agreement_id,
    },
  });
  try {
    logger.info("Add user requested.");

    logger.info("Starting create user process for one user");

    // Check feature flag
    const hasfeatureEnabled = await hasFeatureFlagEnabled({
      featureFlagName: USER_MANAGEMENT_FEATURE_FLAG,
    });

    if (!hasfeatureEnabled) logAndError(logger, "This feature is disabled");

    // Check user has permission
    const userHasPermission = await hasPermissions({
      permissions_required: ADDING_USER_PERMISSIONS_REQUIRED,
      agreement_id,
      user_email: session.user.email,
      target_user: user_to_add_email,
    });

    if (!userHasPermission) {
      logAndError(
        logger,
        "Requesting user does not have permission to add new users, or email input by user is a data wrangler or support admin"
      );
    }

    // No validation for now
    // There should be validation for prod!

    await createOneUser(
      user_to_add_email,
      first_name,
      last_name,
      user_to_add_role,
      agreement_id,
      logger
    );

    logger.info("Add user success.");
  } catch (err) {
    logger.error(err);
    throw new Error("Something went wrong"); // To change for better error handling
  }
}

async function createOneUser(
  user_to_add_email: string,
  first_name: string,
  last_name: string,
  role: string,
  agreement_id: string,
  logger: Logger
) {
  // Call the lambdas
  await createBaseUser({
    user_email: user_to_add_email,
    first_name,
    last_name,
    logger: logger,
  });

  let role_name: string;
  let fleet_type: string | undefined;

  if (role == "Analyst" || role == "Both") {
    role_name =
      agreement_id == "review_file" ? "BasicAgreementAccess" : "Analyst";
    fleet_type = agreement_id == "review_file" ? "review_file" : "default";

    await addRoleToUserInAgreement({
      user_email: user_to_add_email,
      agreement_id,
      role_name,
      fleet_type,
      logger: logger,
      email_type: role == "Both" ? null : "NEW_USER",
    });
  }

  if (role == "UserManager" || role == "Both") {
    await addRoleToUserInAgreement({
      user_email: user_to_add_email,
      agreement_id,
      role_name: "UserManager",
      logger: logger,
      email_type: "NEW_USER",
    });
  }

  // Only add to Databricks group if agreement is not in skip list
  if (!AGREEMENTS_TO_SKIP_DATABRICKS.includes(agreement_id)) {
    await addUserToAgreementAccountGroupInDatabricks({
      user_email: user_to_add_email,
      agreement_id,
      logger: logger,
    });
  }

  logger.info("Finished create user process");
}

interface CreateBaseUser {
  user_email: string;
  first_name: string;
  last_name: string;
  logger: Logger;
}

async function createBaseUser({ logger, ...rest }: CreateBaseUser) {
  return await callLambdaWithFullErrorChecking({
    function_name: process.env.CREATE_BASE_USER_ARN as string,
    raw_payload: rest,
    logger,
    log_result: true,
  });
}

interface AddRoleToUserInAgreement {
  user_email: string;
  agreement_id: string;
  role_name: string;
  fleet_type?: string;
  logger: Logger;
  email_type: "NEW_USER" | "ROLE_CHANGE" | null;
}

async function addRoleToUserInAgreement({
  logger,
  fleet_type,
  ...rest
}: AddRoleToUserInAgreement) {
  const raw_payload = rest;
  if (fleet_type) raw_payload["fleet_type"] = fleet_type;

  return await callLambdaWithFullErrorChecking({
    function_name: process.env.ADD_ROLE_TO_USER_IN_AGREEMENT_ARN as string,
    raw_payload,
    logger,
    log_result: true,
  });
}

interface AddUserToAgreementAccountGroupInDatabricks {
  user_email: string;
  agreement_id: string;
  logger: Logger;
}

async function addUserToAgreementAccountGroupInDatabricks({
  logger,
  ...rest
}: AddUserToAgreementAccountGroupInDatabricks) {
  const raw_payload = rest;

  return await callLambdaWithFullErrorChecking({
    function_name: process.env
      .ADD_USER_TO_AGREEMENT_ACCOUNT_GROUP_IN_DATABRICKS_ARN as string,
    raw_payload,
    logger,
    log_result: true,
  });
}
