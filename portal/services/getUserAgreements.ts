import callLambdaWithFullErrorChecking from 'app/shared/callLambda';

import hasPermissions from '@/app/services/hasPermissions';
import { Actions } from '@/config/constants';

import { getLogger } from '../helpers/logging/logger';
import getAllAgreements from './getAllAgreements';

const logger = getLogger('getUserAgreements');

export interface Agreement {
  agreement_id: string;
  meaningful_name: string | null;
  appstream_desktop_client_enabled?: boolean;
}

export interface UserAgreementsResult {
  selectedAgreement: Agreement | null;
  activeAgreements: Agreement[];
  inductionPassed: boolean;
  inductionNeeded: boolean;
}

export default async function getUserAgreements(
  user_email: string,
): Promise<UserAgreementsResult> {
  const child_logger = logger.child({
    user_email: user_email,
  });

  const resultJson = await callLambdaWithFullErrorChecking({
    function_name: process.env.GET_USER_AGREEMENTS_ARN as string,
    raw_payload: { user_id: user_email },
    logger: child_logger,
  });

  // get_agreements lambda currently sets all agreements to be the active
  // Will need to revisit to correctly return the selected agreement once that lambda is updated
  const selectedAgreement = null;
  const body = JSON.parse(resultJson.body);
  const enabledAgreements = body.agreements.filter(
    ({ user_enabled_in_agreement }) => user_enabled_in_agreement === true,
  );

  let activeAgreements = enabledAgreements;

  const inductionPassed = body.induction.passed;
  const inductionNeeded = activeAgreements.some(
    ({ user_induction_required, application_roles }) =>
      user_induction_required == true &&
      (application_roles.includes('Analyst') ||
        application_roles.includes('BasicAgreementAccess')),
  );

  // add in additional agreements to list if user has permission to see all
  const userHasSeeAllAgreementsPermission = await hasPermissions({
    permissions_required: Actions.SEE_ALL_AGREEMENTS,
    user_email,
  });
  if (userHasSeeAllAgreementsPermission) {
    const dsa_agreements = await getAllAgreements('agreement-dsa-');

    const demo_agreement = await getAllAgreements('agreement-demo');
    const all_agreements = [...dsa_agreements, ...demo_agreement];

    activeAgreements = all_agreements.concat(
      activeAgreements.filter(
        (active) =>
          !all_agreements.some(
            (all) => all.agreement_id === active.agreement_id,
          ),
      ),
    );
  }

  return {
    selectedAgreement,
    activeAgreements,
    inductionPassed,
    inductionNeeded,
  };
}
