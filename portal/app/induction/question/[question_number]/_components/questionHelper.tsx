import { redirect } from 'next/navigation';

import {
  MULTIPLE_CHOICE_KEY,
  Question,
  QUESTIONS_ARRAY,
  SINGLE_CHOICE_KEY,
} from '@/app/induction/question/[question_number]/_components/consts';
import {
  CheckboxInputField,
  RadioButtonInputField,
} from '@/app/shared/formFields';

export function getBackLinkPath({
  current_question_number,
  cookie_wrong,
}: {
  current_question_number: number;
  cookie_wrong: number[];
}) {
  if (current_question_number === 1) return undefined;

  if (cookie_wrong.length > 0) {
    const current_question_index_in_wrong = cookie_wrong.indexOf(
      current_question_number,
    );

    if (current_question_index_in_wrong <= 0) return undefined;
  }

  return `/induction/question/${current_question_number - 1}`;
}

export function isValidQuestionNumber(input: string) {
  if (!/^\d+$/.test(input)) return false;

  const value = parseInt(input);

  if (value == 0) return false;
  if (value > QUESTIONS_ARRAY.length) return false;

  return true;
}

export function QuestionInputs({
  type,
  input_group,
  options,
  saved_question,
  error_ids,
}: {
  type: Question['type'];
  input_group: string;
  options: string[];
  saved_question: number[];
  error_ids?: string[];
}) {
  switch (type) {
    case SINGLE_CHOICE_KEY:
      return options.map((option_text, i) => {
        return (
          <RadioButtonInputField
            label={option_text}
            button_group={input_group}
            button_value={option_text}
            key={option_text}
            default_checked={saved_question.includes(i)}
            error_ids={error_ids}
          />
        );
      });
    case MULTIPLE_CHOICE_KEY:
      return options.map((option_text, i) => {
        return (
          <CheckboxInputField
            label={option_text}
            button_group={input_group}
            button_value={option_text}
            key={option_text}
            default_checked={saved_question.includes(i)}
            error_ids={error_ids}
          />
        );
      });
  }
}

export function goToFirstUnansweredQuestion(
  current_question: number,
  answers: { [index: string]: number[] },
  wrong: number[],
) {
  const questions = wrong.length
    ? wrong
    : Array.from(Array(10).keys()).map((i) => i + 1);

  for (const i of questions) {
    if (i == current_question) return;

    if (!answers[i.toString()]) {
      redirect(`/induction/question/${i}`);
    }
  }
}
