import QuestionClient from "./questionClient";
import submitQuestionAnswer from "./serverActions";
import { redirect } from "next/navigation";
import parseInductionCookie from "app/induction/inductionCookie";

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
      : question_number == 10;

  return (
    <QuestionClient
      saved_question={saved_question}
      question_number={question_number}
      goBackLinkPath={getBackLinkPath(question_number, cookie_wrong)}
      isFinalQuestion={isFinalQuestion}
      submitQuestionAnswer={submitQuestionAnswer.bind(null, {
        question_number,
      })}
    />
  );
}

function getBackLinkPath(
  current_question_number: number,
  cookie_wrong: number[]
) {
  if (current_question_number === 1) return undefined;

  if (cookie_wrong.length > 0) {
    const current_question_index_in_wrong = cookie_wrong.indexOf(
      current_question_number
    );

    return current_question_index_in_wrong === 0
      ? undefined
      : `/induction/question/${
          cookie_wrong[current_question_index_in_wrong - 1]
        }`;
  }

  return `/induction/question/${current_question_number - 1}`;
}

function goToFirstUnansweredQuestion(
  current_question: number,
  answers: { [index: string]: number[] },
  wrong: number[]
) {
  let questions = wrong.length
    ? wrong
    : Array.from(Array(10).keys()).map((i) => i + 1);

  for (let i of questions) {
    if (i == current_question) return;

    if (!answers[i.toString()]) {
      redirect(`/induction/question/${i}`);
    }
  }
}
