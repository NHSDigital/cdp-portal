import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { getLogger } from 'helpers/logging/logger';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import getUserAgreements from 'services/getUserAgreements';

import { getNextUncompletedQuestionNumber } from '@/app/shared/inductionHelpers';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import InductionStartPageContent from './_components/inductionStartPageContent';

const logger = getLogger('inductionPage');

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Complete the induction assessment - ${whiteLabelValues.acronym}`,
  };
}

export default async function InductionPage() {
  const link_question_number = await getNextUncompletedQuestionNumber();
  const session = await getServerSessionErrorIfMissingProperties(logger);
  const results = await getUserAgreements(session.user.email);
  if (!results.inductionNeeded || results.inductionPassed) redirect('/');

  return <InductionStartPageContent questionNumber={link_question_number} />;
}
