import parseInductionCookie from 'app/induction/_components/inductionCookie';

import { QUESTIONS_ARRAY } from '@/app/induction/question/[question_number]/_components/consts';
import {
  getBackLinkPath,
  goToFirstUnansweredQuestion,
} from '@/app/induction/question/[question_number]/_components/questionHelper';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import QuestionClient from './_components/questionClient';
import submitQuestionAnswer from './_components/serverActions';

interface QuestionPageProps {
  params: { question_number: string };
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const question_number = parseInt(params.question_number);
  const { cookie_answers, cookie_wrong } = await parseInductionCookie();

  goToFirstUnansweredQuestion(question_number, cookie_answers, cookie_wrong);

  const saved_question = cookie_answers[question_number];

  const isFinalQuestion =
    cookie_wrong.length > 0
      ? question_number == cookie_wrong.at(-1)
      : question_number == QUESTIONS_ARRAY.length;

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <section data-cy={`induction-question-${question_number}`}>
      <QuestionClient
        saved_question={saved_question}
        question_number={question_number}
        goBackLinkPath={getBackLinkPath({
          current_question_number: question_number,
          cookie_wrong: cookie_wrong,
        })}
        isFinalQuestion={isFinalQuestion}
        submitQuestionAnswer={submitQuestionAnswer.bind(null, {
          question_number,
        })}
        whiteLabelValues={whiteLabelValues}
      />
    </section>
  );
}
