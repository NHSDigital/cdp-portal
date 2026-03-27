'use client';

import Link from 'next/link';

export default function InductionStartPageContent({
  questionNumber,
}: {
  questionNumber: number;
}) {
  return (
    <section data-cy='induction-start-page'>
      <h1 data-cy='page-title'>Complete the induction assessment</h1>
      <p data-cy='induction-description'>
        Before accessing the SDE, you will need to complete this short
        assessment to test your knowledge of how the SDE works.
      </p>
      <p data-cy='before-start-text'>Before you start:</p>
      <ul data-cy='intro-link-list'>
        <li>
          make sure you have read the{' '}
          <a
            href='https://digital.nhs.uk/services/secure-data-environment-service/introduction'
            target='_blank'
            data-cy='intro-link'
          >
            Introduction to the Secure Data Environment (opens in a new window)
          </a>
        </li>
      </ul>
      <p data-cy='this-assessment-text'>This assessment:</p>
      <ul data-cy='info-list'>
        <li>contains 10 questions</li>
        <li>takes approximately 15 minutes to complete</li>
      </ul>
      <p data-cy='answer-all-questions-paragraph'>
        You must answer all questions correctly to pass. You can retake this
        assessment as many times as you need to. You can also come back to
        complete it later.
      </p>
      <p data-cy='sde-access-paragraph'>
        After you have passed the assessment, you will be able to access data
        through the SDE.
      </p>
      <Link
        data-cy='continue-button'
        href={`/induction/question/${questionNumber}`}
        className='nhsuk-button'
      >
        Continue
      </Link>
    </section>
  );
}
