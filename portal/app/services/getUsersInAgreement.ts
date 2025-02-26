import callLambdaWithFullErrorChecking from "app/shared/callLambda";
import { getLoggerAndSession } from "app/shared/logging";

const LOGGER_NAME = "getUsersInAgreement";

export interface RawUser {
  first_name: string;
  last_name: string;
  email: string;
  enabled_global: boolean;
  enabled_agreement: boolean;
  fleet_type?: string;
  creation_timestamp_global?: string;
  creation_timestamp_agreement?: string;
  last_login?: string;
  application_roles_global?: string[];
  access_roles_global?: string[];
  application_roles_agreement?: string[];
  reactivated_timestamp_agreement?: string;
  disabled_timestamp_agreement?: string;
  disabled_timestamp_global?: string;
  induction: { passed: true; passed_timestamp: string } | { passed: false };
}

export interface User extends RawUser {
  calculated_status: "Activated" | "Deactivated" | "Pending Induction";
}

export interface GetUsersInAgreementResponse {
  users: User[];
  agreement: { meaningful_name: string | null };
}

const getUsersInAgreement = async (
  agreement_id: string
): Promise<GetUsersInAgreementResponse> => {
  const { logger } = await getLoggerAndSession(LOGGER_NAME, {
    agreementId: agreement_id,
  });
  try {
    const resultJson = await callLambdaWithFullErrorChecking({
      function_name: process.env.GET_USERS_IN_AGREEMENT_ARN as string,
      raw_payload: { agreement_id },
      logger,
    });

    const users: User[] = (JSON.parse(resultJson.body).users as RawUser[])
      .map(changeBasicAgreementAccessToAnalyst)
      .map(calculateUserStatus);
    const agreement = JSON.parse(resultJson.body).agreement;

    return { users, agreement };
  } catch (e) {
    logger.error({
      state: "Error in getUsersInAgreement request",
      status: 500,
      error: e,
    });
    throw new Error("Error getting all the users in the agreement");
  }
};

export function changeBasicAgreementAccessToAnalyst(user: RawUser): RawUser {
  return {
    ...user,
    application_roles_agreement: (user.application_roles_agreement || []).map(
      (role) => (role === "BasicAgreementAccess" ? "Analyst" : role)
    ),
  };
}

export function calculateUserStatus(user: RawUser): User {
  const enabled_overall = user.enabled_agreement && user.enabled_global;
  const is_analyst = user.application_roles_agreement?.includes("Analyst");
  const done_induction = user.induction.passed;
  let calculated_status;
  if (!enabled_overall) {
    calculated_status = "Deactivated";
  } else if (!is_analyst) {
    calculated_status = "Activated";
  } else if (!done_induction) {
    calculated_status = "Pending Induction";
  } else {
    calculated_status = "Activated";
  }
  return {
    ...user,
    calculated_status: calculated_status,
  };
}

export default getUsersInAgreement;
