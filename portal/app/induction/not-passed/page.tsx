import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { getLogger } from 'helpers/logging/logger';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import getUserAgreements from 'services/getUserAgreements';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import parseInductionCookie from '../_components/inductionCookie';
import { QUESTIONS_ARRAY } from '../question/[question_number]/_components/consts';
import InductionNotPassedPageContent from './_components/inductionNotPassedPageContent';

const logger = getLogger('notPassed');

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Assessment not passed - ${whiteLabelValues.acronym}`,
  };
}

export default async function InductionFailedPage() {
  const { cookie_wrong } = await parseInductionCookie();

  if (cookie_wrong.length == 0) redirect('/');

  const session = await getServerSessionErrorIfMissingProperties(logger);
  const results = await getUserAgreements(session.user.email);
  if (!results.inductionNeeded || results.inductionPassed) redirect('/');

  const wrong_answer_data = cookie_wrong.map((number) => ({
    number,
    heading: QUESTIONS_ARRAY[number - 1].heading,
  }));

  return (
    <InductionNotPassedPageContent
      wrong_answer_data={wrong_answer_data}
      cookie_wrong={cookie_wrong}
    />
  );
}
