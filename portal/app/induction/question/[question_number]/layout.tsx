import React from "react";
import { QUESTIONS_ARRAY } from "./consts";
import { notFound } from "next/navigation";
import getUserAgreements from "services/getUserAgreements";
import { redirect } from "next/navigation";
import { getServerSessionErrorIfMissingProperties } from "app/shared/common";
import { getLogger } from "helpers/logging/logger";

const logger = getLogger("questionLayout");

interface QuestionLayoutProps {
  children: React.ReactNode;
  params: { question_number: string };
}
export default async function QuestionPageLayout({
  children,
  params,
}: QuestionLayoutProps) {
  const session = await getServerSessionErrorIfMissingProperties(logger);
  const results = await getUserAgreements(session.user.email);
  if (!results.inductionNeeded || results.inductionPassed) redirect("/");

  const question_number = params.question_number;
  return isValidQuestionNumber(question_number) ? <>{children}</> : notFound();
}

function isValidQuestionNumber(input: string) {
  // check for only positive integers
  if (!/^\d+$/.test(input)) return false;

  const value = parseInt(input);

  // 1 index so dont allow 0
  if (value == 0) return false;
  // check within question limit
  if (value > QUESTIONS_ARRAY.length) return false;

  return true;
}
