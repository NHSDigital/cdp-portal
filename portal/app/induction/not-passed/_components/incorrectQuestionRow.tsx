export function IncorrectQuestionRow({
  number,
  heading,
}: {
  number: number;
  heading: string;
}) {
  return (
    <div data-cy='question-row' className='nhsuk-summary-list__row'>
      <dt
        data-cy='question-number'
        className='nhsuk-summary-list__key nhsuk-u-padding-top-3 nhsuk-u-padding-bottom-3'
      >
        Question {number}
      </dt>
      <dd
        data-cy='question-heading'
        className='nhsuk-summary-list__value nhsuk-u-padding-top-3 nhsuk-u-padding-bottom-3'
      >
        {heading}
      </dd>
      <dd
        data-cy='question-status'
        className='nhsuk-summary-list__actions nhsuk-u-padding-top-3 nhsuk-u-padding-bottom-3'
      >
        <strong className='nhsuk-tag nhsuk-tag--red'>Incorrect</strong>
      </dd>
    </div>
  );
}
