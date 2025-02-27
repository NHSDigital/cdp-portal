"use client";

import {
  RadioButtonInputField,
  CheckboxInputField,
} from "app/shared/formFields";
import SubmitButton from "app/shared/submitButton";
import { useFormState } from "react-dom";
import {
  MULTIPLE_CHOICE_KEY,
  QUESTIONS_ARRAY,
  Question,
  SINGLE_CHOICE_KEY,
} from "./consts";
import ErrorSummary from "app/shared/errorSummary";
import { useEffect } from "react";
import BackLink from "app/shared/backLink";
import styles from "./induction.module.css";

interface QuestionClientProps {
  saved_question: number[] | undefined;
  question_number: number;
  goBackLinkPath: string | undefined;
  isFinalQuestion: boolean;
  submitQuestionAnswer: (form_data: FormData) => void;
}

const INITIAL_STATE = {};

export default function QuestionClient({
  saved_question,
  question_number,
  goBackLinkPath,
  isFinalQuestion,
  submitQuestionAnswer,
}: QuestionClientProps) {
  const [state, formAction] = useFormState(submitQuestionAnswer, INITIAL_STATE);

  const question_array_index = question_number - 1;
  const question_error_id = `question_${question_number}_error`;
  const { type, heading, subtext, options } =
    QUESTIONS_ARRAY[question_array_index];

  useEffect(() => {
    document.title = `${heading} - SDE`;
  });

  // NHS service manual states must move focus to error summary when it appears
  useEffect(() => {
    document.getElementById("error-summary")?.focus();
  }, [state.error]);

  return (
    <>
      {goBackLinkPath && <BackLink href={goBackLinkPath} />}
      {state.error && (
        <ErrorSummary
          errors={[
            {
              input_id: `question_${question_number}-${options[0]}-input`,
              errors_list: [state.error],
            },
          ]}
        />
      )}
      <form action={formAction}>
        <div
          className={
            state.error
              ? "nhsuk-form-group nhsuk-form-group--error nhsuk-u-margin-bottom-7"
              : "nhsuk-form-group nhsuk-u-margin-bottom-7"
          }
        >
          <fieldset className={styles.noBorder}>
            <legend className="nhsuk-fieldset__legend">
              <span className="nhsuk-caption-l nhsuk-caption--bottom nhsuk-u-margin-bottom-4">
                Question {question_number}
              </span>
              <h1>{heading}</h1>
            </legend>
            <span className="nhsuk-caption-l nhsuk-caption--top">
              {subtext}
            </span>

            {state.error && (
              <span className="nhsuk-error-message" id={question_error_id}>
                <span className="nhsuk-u-visually-hidden">Error:</span>{" "}
                {state.error}
              </span>
            )}

            <QuestionInputs
              type={type}
              input_group={`question_${question_number}`}
              options={options}
              saved_question={saved_question || []}
              error_ids={state.error && [question_error_id]}
            />
          </fieldset>
        </div>

        <SubmitButton>
          {isFinalQuestion ? "Submit Answers" : "Continue"}
        </SubmitButton>
      </form>
    </>
  );
}

function QuestionInputs({
  type,
  input_group,
  options,
  saved_question,
  error_ids,
}: {
  type: Question["type"];
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
