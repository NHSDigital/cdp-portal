import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { getLogger } from 'helpers/logging/logger';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import React from 'react';
import getUserAgreements from 'services/getUserAgreements';

import { isValidQuestionNumber } from '@/app/induction/question/[question_number]/_components/questionHelper';
const logger = getLogger('questionLayout');
interface QuestionLayoutProps {
  children: React.ReactNode;
  params: Promise<{ question_number: string }>;
}
export default async function QuestionPageLayout({
  children,
  params,
}: QuestionLayoutProps) {
  const session = await getServerSessionErrorIfMissingProperties(logger);
  const results = await getUserAgreements(session.user.email);
  if (!results.inductionNeeded || results.inductionPassed) redirect('/');
  const question_number = (await params).question_number;
  return isValidQuestionNumber(question_number) ? <>{children}</> : notFound();
}
