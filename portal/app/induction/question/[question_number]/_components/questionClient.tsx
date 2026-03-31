'use client';

import BackLink from 'app/shared/backLink';
import ErrorSummary from 'app/shared/errorSummary';
import SubmitButton from 'app/shared/submitButton';
import { useActionState, useEffect } from 'react';

import { QuestionInputs } from '@/app/induction/question/[question_number]/_components/questionHelper';
import { WhiteLabelEntry } from '@/config/whiteLabel';

import { QUESTIONS_ARRAY } from './consts';
import styles from './induction.module.css';
interface QuestionClientProps {
  saved_question: number[] | undefined;
  question_number: number;
  goBackLinkPath: string | undefined;
  isFinalQuestion: boolean;
  submitQuestionAnswer: (
    prevState: QuestionState,
    formData: FormData,
  ) => Promise<QuestionState> | QuestionState;
  whiteLabelValues: WhiteLabelEntry;
}

type QuestionState = {
  error?: string;
};

const INITIAL_STATE: QuestionState = {};

export default function QuestionClient({
  saved_question,
  question_number,
  goBackLinkPath,
  isFinalQuestion,
  submitQuestionAnswer,
  whiteLabelValues,
}: QuestionClientProps) {
  const [state, formAction] = useActionState(
    submitQuestionAnswer,
    INITIAL_STATE,
  );

  const question_array_index = question_number - 1;
  const question_error_id = `question_${question_number}_error`;
  const { type, heading, subtext, options } =
    QUESTIONS_ARRAY[question_array_index];

  useEffect(() => {
    document.title = `${heading} - ${whiteLabelValues.acronym}`;
  });

  useEffect(() => {
    document.getElementById('error-summary')?.focus();
  }, [state.error]);

  return (
    <>
      {goBackLinkPath && (
        <BackLink href={goBackLinkPath} data-cy='go-back-link' />
      )}
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
      <form action={formAction} data-testid='question-form'>
        <div
          data-cy='error-state'
          className={
            state.error
              ? 'nhsuk-form-group nhsuk-form-group--error nhsuk-u-margin-bottom-7'
              : 'nhsuk-form-group nhsuk-u-margin-bottom-7'
          }
        >
          <fieldset className={styles.noBorder}>
            <legend className='nhsuk-fieldset__legend'>
              <span
                className='nhsuk-caption-l nhsuk-caption--bottom nhsuk-u-margin-bottom-4'
                data-cy={'question-number'}
              >
                Question {question_number}
              </span>
              <h1>{heading}</h1>
            </legend>
            <span
              className='nhsuk-caption-l nhsuk-caption--top'
              data-cy={'question-subtext'}
            >
              {subtext}
            </span>

            {state.error && (
              <span
                className='nhsuk-error-message'
                id={question_error_id}
                data-cy={'error-message'}
              >
                <span className='nhsuk-u-visually-hidden'>Error:</span>{' '}
                {state.error}
              </span>
            )}

            <QuestionInputs
              type={type}
              input_group={`question_${question_number}`}
              options={options}
              saved_question={saved_question || []}
              error_ids={state.error ? [question_error_id] : undefined}
            />
          </fieldset>
        </div>

        <SubmitButton>
          {isFinalQuestion ? 'Submit Answers' : 'Continue'}
        </SubmitButton>
      </form>
    </>
  );
}
