import parseInductionCookie from '@/app/induction/_components/inductionCookie';
import { QUESTIONS_ARRAY } from '@/app/induction/question/[question_number]/_components/consts';

export async function getNextUncompletedQuestionNumber(): Promise<number> {
  const { cookie_answers } = await parseInductionCookie();
  const total_questions = QUESTIONS_ARRAY.length;

  if (!cookie_answers) return 1;

  for (let index = 1; index <= total_questions; index++) {
    if (!(index.toString() in cookie_answers)) return index;
  }

  return total_questions;
}

export function getInductionRedirectTarget({
  inductionFeatureFlagEnabled,
  inductionNeeded,
  inductionPassed,
}: {
  inductionFeatureFlagEnabled: boolean;
  inductionNeeded: boolean;
  inductionPassed: boolean;
}): string | null {
  if (inductionFeatureFlagEnabled && inductionNeeded && !inductionPassed) {
    return '/induction';
  }

  return null;
}
