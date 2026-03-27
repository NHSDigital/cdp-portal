import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import React from 'react';

import { IncorrectQuestionRow } from '@/app/induction/not-passed/_components/incorrectQuestionRow';
import { getByDataCy } from '@/jest/utils';

const props = {
  number: 1,
  heading: 'Is the fishy in the dishy?',
};

describe('IncorrectQuestionRow', () => {
  it('renders with correct question number and heading', () => {
    render(<IncorrectQuestionRow {...props} />);

    expect(getByDataCy('question-row')).toBeInTheDocument();
    expect(getByDataCy('question-number')).toHaveTextContent('Question 1');
    expect(getByDataCy('question-heading')).toHaveTextContent(
      'Is the fishy in the dishy?',
    );
    expect(getByDataCy('question-status')).toHaveTextContent('Incorrect');
  });

  it('has red tag for incorrect status', () => {
    render(<IncorrectQuestionRow {...props} />);

    const tag = getByDataCy('question-status').querySelector('strong');

    expect(tag).toHaveClass('nhsuk-tag nhsuk-tag--red');
    expect(tag).toHaveTextContent('Incorrect');
  });
});
