import { render, screen } from '@testing-library/react';

import InductionNotPassedPageContent from '@/app/induction/not-passed/_components/inductionNotPassedPageContent';
import { getByDataCy } from '@/jest/utils';

describe('InductionNotPassedPageContent', () => {
  const props = {
    cookie_wrong: [3, 4],
    wrong_answer_data: [
      { number: 3, heading: 'Is soup for eating or for drinking?' },
      { number: 4, heading: 'Is a hot dog a sandwich?' },
    ],
  };

  it('renders main page content correctly', () => {
    render(<InductionNotPassedPageContent {...props} />);

    expect(getByDataCy('induction-not-passed-page')).toBeInTheDocument();
    expect(getByDataCy('page-title')).toHaveTextContent(
      'Assessment not passed',
    );
    expect(getByDataCy('summary-text')).toHaveTextContent(
      'You will need to retake the following questions',
    );
    expect(getByDataCy('help-text')).toHaveTextContent(
      'For help with answering these questions',
    );
    expect(getByDataCy('introduction-link')).toHaveAttribute(
      'href',
      expect.stringContaining('digital.nhs.uk'),
    );
    expect(getByDataCy('wrong-question-list')).toBeInTheDocument();
    expect(getByDataCy('retake-button')).toHaveAttribute(
      'href',
      '/induction/question/3',
    );
  });

  it('renders all incorrect questions', () => {
    render(<InductionNotPassedPageContent {...props} />);

    const rows = screen.getAllByText(
      (_content, el) => el?.getAttribute('data-cy') === 'question-row',
    );
    expect(rows.length).toBe(2);
  });
});
