import callLambdaWithFullErrorChecking from 'app/shared/callLambda';

import { getLogger } from '../helpers/logging/logger';
import { Agreement } from './getUserAgreements';

const logger = getLogger('getUserAgreements');

export default async function getAllAgreements(
  eventfilter = 'agreement-',
): Promise<Agreement[]> {
  const filterEvent = {
    filter: {
      attribute: 'PK',
      condition: 'begins_with',
      value: eventfilter,
    },
  };

  const resultJson = await callLambdaWithFullErrorChecking({
    function_name: process.env.GET_ALL_AGREEMENTS_ARN as string,
    raw_payload: filterEvent,
    logger,
  });

  return JSON.parse(resultJson.body).agreements;
}
