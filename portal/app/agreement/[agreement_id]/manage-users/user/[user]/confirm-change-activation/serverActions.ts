"use server";

import hasFeatureFlagEnabled from "app/services/hasFeatureFlagEnabled";
import { logAndError } from "app/shared/common";
import { getLoggerAndSession } from "app/shared/logging";
import { cookies } from "next/headers";
import {
  CHANGE_ACTIVATION_PERMISSIONS_REQUIRED,
  USER_MANAGEMENT_FEATURE_FLAG,
} from "../../../consts";
import hasPermissions from "app/services/hasPermissions";
import { callLambdaWithoutFullErrorChecking } from "app/shared/callLambda";
import { Logger } from "pino";
import { redirect } from "next/navigation";
import getAgreementUserDetails from "app/services/getAgreementUserDetails";

const LOGGER_NAME = "changeActivation";

interface ChangeActivation {
  agreement_id: string;
  user_to_change_activation_email: string;
  new_activation: boolean;
}

export default async function changeActivation(
  {
    agreement_id,
    user_to_change_activation_email,
    new_activation,
  }: ChangeActivation,
  previous_state: any,
  form_data: FormData
) {
  if (form_data.get("confirm") === "No") {
    redirect(
      `/agreement/${agreement_id}/manage-users/user/${encodeURIComponent(
        user_to_change_activation_email
      )}`
    );
  }

  const { logger, session } = await getLoggerAndSession(LOGGER_NAME, {
    user_to_change_activation: {
      user_email: user_to_change_activation_email,
      new_activation,
      agreement_id,
    },
  });

  try {
    if (form_data.get("confirm") !== "Yes") {
      logger.info("User did not select yes on confirm screen");
      return {
        error: `Select yes to ${
          new_activation ? "reactivate" : "deactivate"
        } this user`,
      };
    }

    logger.info("Change user activation requested.");

    logger.info("Starting change user activation process");

    // Check feature flag
    const hasfeatureEnabled = await hasFeatureFlagEnabled({
      featureFlagName: USER_MANAGEMENT_FEATURE_FLAG,
    });

    if (!hasfeatureEnabled) logAndError(logger, "This feature is disabled");

    // Check user has permission
    const userHasPermission = await hasPermissions({
      permissions_required: CHANGE_ACTIVATION_PERMISSIONS_REQUIRED,
      agreement_id,
      user_email: session.user.email,
      target_user: user_to_change_activation_email,
    });

    if (!userHasPermission) {
      logAndError(
        logger,
        "Requesting user does not have permission to change user activation"
      );
    }

    // No validation for now
    // There should be validation for prod!

    const user_to_change_details = await getAgreementUserDetails(
      agreement_id,
      user_to_change_activation_email
    );

    await changeUserActivation({
      logger,
      user_email: user_to_change_activation_email,
      agreement_id,
      new_activation,
    });

    logger.info("Change user activation success.");

    cookies().set(
      "manage_users_success_message",
      `${user_to_change_details.first_name} ${
        user_to_change_details.last_name
      } has been ${new_activation ? "reactivated" : "deactivated"}.`,
      { expires: Date.now() + 30 * 1000 }
    );
  } catch (err) {
    logger.error(err);
    throw new Error("Something went wrong"); // To change for better error handling
  }
  redirect(`/agreement/${agreement_id}/manage-users`);
}

interface ChangeUserActivation {
  user_email: string;
  agreement_id: string;
  new_activation: boolean;
  logger: Logger;
}

async function changeUserActivation({ logger, ...rest }: ChangeUserActivation) {
  return await callLambdaWithoutFullErrorChecking({
    function_name: process.env.CHANGE_USER_ACTIVATION_ARN as string,
    raw_payload: rest,
    logger,
    log_result: true,
  });
}
