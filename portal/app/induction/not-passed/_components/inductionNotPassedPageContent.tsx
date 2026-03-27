'use client';

import Link from 'next/link';

import { IncorrectQuestionRow } from '@/app/induction/not-passed/_components/incorrectQuestionRow';

type Props = {
  cookie_wrong: number[];
  wrong_answer_data: {
    number: number;
    heading: string;
  }[];
};

export default function InductionNotPassedPageContent({
  cookie_wrong,
  wrong_answer_data,
}: Props) {
  return (
    <section data-cy='induction-not-passed-page'>
      <h1 data-cy='page-title'>Assessment not passed</h1>
      <p data-cy='summary-text'>
        You will need to retake the following questions. You can come back and
        do this at any time.
      </p>
      <p className='nhsuk-u-margin-bottom-6' data-cy='help-text'>
        For help with answering these questions, you can view the{' '}
        <a
          data-cy='introduction-link'
          href='https://digital.nhs.uk/services/secure-data-environment-service/introduction'
          target='_blank'
        >
          SDE induction (opens in a new tab).
        </a>
      </p>

      <dl data-cy='wrong-question-list' className='nhsuk-summary-list'>
        {wrong_answer_data.map((question) => (
          <IncorrectQuestionRow
            key={question.number}
            number={question.number}
            heading={question.heading}
          />
        ))}
      </dl>

      <Link
        data-cy='retake-button'
        href={`/induction/question/${cookie_wrong[0]}`}
        className='nhsuk-button'
      >
        Retake these questions
      </Link>
    </section>
  );
}
