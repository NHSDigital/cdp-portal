import { getLogger } from "../helpers/logging/logger";
import callLambdaWithFullErrorChecking from "app/shared/callLambda";

const logger = getLogger("getUserAgreements");

export interface Agreement {
  agreement_id: string;
  meaningful_name: string | null;
}

export interface UserAgreementsResult {
  selectedAgreement: Agreement | null;
  activeAgreements: Agreement[];
  inductionPassed: boolean;
  inductionNeeded: boolean;
}

export default async function getUserAgreements(
  user_id: string
): Promise<UserAgreementsResult> {
  const child_logger = logger.child({
    user_id: user_id,
  });

  const resultJson = await callLambdaWithFullErrorChecking({
    function_name: process.env.GET_USER_AGREEMENTS_ARN as string,
    raw_payload: { user_id },
    logger: child_logger,
  });

  // get_agreements lambda currently sets all agreements to be the active
  // Will need to revisit to correctly return the selected agreement once that lambda is updated
  const selectedAgreement = null;
  const body = JSON.parse(resultJson.body);
  const activeAgreements = body.agreements.filter(
    ({ user_enabled_in_agreement }) => user_enabled_in_agreement === true
  );
  const inductionPassed = body.induction.passed;

  const inductionNeeded = activeAgreements.some(
    ({ user_induction_required, application_roles }) =>
      user_induction_required == true &&
      (application_roles.includes("Analyst") ||
        application_roles.includes("BasicAgreementAccess"))
  );
  return {
    selectedAgreement,
    activeAgreements,
    inductionPassed,
    inductionNeeded,
  };
}
