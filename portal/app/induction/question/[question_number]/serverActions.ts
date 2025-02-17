"use server";

import { getLoggerAndSession } from "app/shared/logging";
import {
  QUESTIONS_ARRAY,
  SINGLE_CHOICE_KEY,
  MULTIPLE_CHOICE_KEY,
} from "./consts";
import { redirect } from "next/navigation";
import callLambdaWithFullErrorChecking from "app/shared/callLambda";
import parseInductionCookie, {
  setInductionCookie,
} from "app/induction/inductionCookie";

interface submitQuestionAnswerProps {
  question_number: number;
}

const LOGGER_NAME = "submitQuestionAnswer";
const ONE_DAY_MS = 86400000;

export default async function submitQuestionAnswer(
  { question_number }: submitQuestionAnswerProps,
  previous_state: any,
  form_data: FormData
) {
  const question_array_index = question_number - 1;
  const selected_options = form_data.getAll(`question_${question_number}`);

  if (selected_options.length === 0) {
    switch (QUESTIONS_ARRAY[question_array_index].type) {
      case SINGLE_CHOICE_KEY:
        return {
          error: "You must select an option to continue",
        };
      case MULTIPLE_CHOICE_KEY:
        return {
          error: "You must select at least one option to continue",
        };
    }
  }

  const selected_options_indexes = selected_options.map((selected_option) => {
    return QUESTIONS_ARRAY[question_array_index].options.indexOf(
      selected_option.toString()
    );
  });

  const { cookie_answers, cookie_wrong } = await parseInductionCookie();

  // update cookie and set it again
  const updated_answers = {
    ...cookie_answers,
    [question_number]: selected_options_indexes,
  };

  setInductionCookie(updated_answers, cookie_wrong);

  // in wrong question flow
  if (cookie_wrong.length > 0) {
    const current_question_index_in_wrong =
      cookie_wrong.indexOf(question_number);

    // if on last wrong question, mark answers
    if (current_question_index_in_wrong === cookie_wrong.length - 1) {
      markAnswers(updated_answers, cookie_wrong);
    } else {
      redirect(
        `/induction/question/${
          cookie_wrong[current_question_index_in_wrong + 1]
        }`
      );
    }
  }
  // normal flow, on last question, mark answers
  else if (question_array_index === QUESTIONS_ARRAY.length - 1) {
    markAnswers(updated_answers, cookie_wrong);
  } else {
    redirect(`/induction/question/${question_number + 1}`);
  }
}

function markAnswers(
  user_inputs: { [index: string]: number[] },
  previously_wrong_questions: number[]
) {
  const incorrect_questions: number[] = [];

  const question_idxs_to_check =
    previously_wrong_questions.length === 0
      ? Array.from(Array(10).keys())
      : previously_wrong_questions.map((index) => index - 1);

  for (const index of question_idxs_to_check) {
    const question_number = index + 1;
    const question_data = QUESTIONS_ARRAY[index];

    const input_indexes = user_inputs[question_number];

    if (!input_indexes) {
      incorrect_questions.push(question_number);
      continue;
    }

    const input_strings = input_indexes.map(
      (index) => question_data.options[index]
    );

    if (
      JSON.stringify(input_strings.sort()) !==
      JSON.stringify(question_data.answers.sort())
    ) {
      incorrect_questions.push(question_number);
    }
  }

  callRecordInductionAssessmentAttempt(
    incorrect_questions.length === 0,
    Object.keys(user_inputs).map((key) => parseInt(key)),
    incorrect_questions
  );

  if (incorrect_questions.length === 0) {
    setInductionCookie({}, [], true);
    redirect("/induction/passed");
  } else {
    setInductionCookie({}, incorrect_questions);
    redirect(`/induction/not-passed`);
  }
}

async function callRecordInductionAssessmentAttempt(
  passed: boolean,
  attempted_questions: number[],
  incorrect_questions?: number[]
) {
  const { logger, session } = await getLoggerAndSession(LOGGER_NAME);

  await callLambdaWithFullErrorChecking({
    function_name: process.env
      .RECORD_INDUCTION_ASSESSMENT_ATTEMPT_ARN as string,
    raw_payload: {
      user_email: session.user.email,
      passed,
      attempted_questions,
      incorrect_questions,
    },
    logger,
  });
}
