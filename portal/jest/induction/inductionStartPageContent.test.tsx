import '@testing-library/jest-dom';

import { render } from '@testing-library/react';

import InductionStartPageContent from '@/app/induction/_components/inductionStartPageContent';
import { getByDataCy } from '@/jest/utils';

describe('InductionStartPageContent', () => {
  it('renders full content correctly', () => {
    render(<InductionStartPageContent questionNumber={1} />);

    // Headings and paragraphs
    expect(getByDataCy('induction-start-page')).toBeInTheDocument();
    expect(getByDataCy('page-title')).toHaveTextContent(
      'Complete the induction assessment',
    );
    expect(getByDataCy('induction-description')).toHaveTextContent(
      'Before accessing the SDE, you will need to complete this short assessment to test your knowledge of how the SDE works.',
    );
    expect(getByDataCy('before-start-text')).toHaveTextContent(
      'Before you start:',
    );
    expect(getByDataCy('this-assessment-text')).toHaveTextContent(
      'This assessment:',
    );
    expect(getByDataCy('answer-all-questions-paragraph')).toHaveTextContent(
      'You must answer all questions correctly to pass',
    );
    expect(getByDataCy('sde-access-paragraph')).toHaveTextContent(
      'After you have passed the assessment',
    );

    // Intro link
    const introLink = getByDataCy('intro-link');
    expect(introLink).toBeInTheDocument();
    expect(introLink).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service/introduction',
    );
    expect(introLink).toHaveAttribute('target', '_blank');

    // Lists
    expect(getByDataCy('intro-link-list').querySelectorAll('li')).toHaveLength(
      1,
    );
    expect(getByDataCy('info-list').querySelectorAll('li')).toHaveLength(2);

    // Continue button
    const continueButton = getByDataCy('continue-button');
    expect(continueButton).toHaveTextContent('Continue');
    expect(continueButton).toHaveAttribute('href', '/induction/question/1');
  });

  it('renders correct questionNumber in link', () => {
    render(<InductionStartPageContent questionNumber={5} />);
    expect(getByDataCy('continue-button')).toHaveAttribute(
      'href',
      '/induction/question/5',
    );
  });
});
