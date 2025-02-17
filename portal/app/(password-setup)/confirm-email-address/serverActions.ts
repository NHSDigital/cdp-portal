"use server";

import callLambdaWithFullErrorChecking from "app/shared/callLambda";
import { getLogger } from "helpers/logging/logger";

const LOG = getLogger("callUserPasswordSetupService");

export default async function callUserPasswordSetupService(
  user_email: string,
  guid: string
): Promise<{
  valid_email: boolean;
  valid_guid: boolean;
  message?: string;
}> {
  const resultJson = await callLambdaWithFullErrorChecking({
    function_name: process.env.USER_PASSWORD_SETUP_SERVICE_ARN as string,
    raw_payload: {
      event_type: "verify_email_address",
      user_email,
      guid,
    },
    logger: LOG,
    log_result: true,
  });
  return JSON.parse(resultJson.body);
}
