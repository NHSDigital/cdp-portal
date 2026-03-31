'use server';

import callLambdaWithFullErrorChecking from 'app/shared/callLambda';
import { getLogger } from 'helpers/logging/logger';

import { getWhiteLabelValues } from '@/config/whiteLabel';

const LOG = getLogger('callUserPasswordSetupService');

export type invokeResendEmailType = {
  success: boolean;
};

export async function invokeResendEmail(
  _previousFormState: invokeResendEmailType,
  formData: FormData,
): Promise<invokeResendEmailType> {
  const email = formData.get('email') as string;
  const service_acronym = getWhiteLabelValues().acronym as string;
  await callLambdaWithFullErrorChecking({
    function_name: process.env.USER_PASSWORD_SETUP_SERVICE_ARN as string,
    raw_payload: {
      event_type: 'resend_email',
      user_email: email,
      service: service_acronym,
    },
    logger: LOG,
    log_result: true,
  });

  return {
    success: true,
  };
}
