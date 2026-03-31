import { render } from '@testing-library/react';

import InductionPassedPageContent from '@/app/induction/passed/_components/inductionPassedPageContent';
import { getByDataCy } from '@/jest/utils';

describe('InductionPassedPageContent', () => {
  it('renders main page content correctly', () => {
    render(<InductionPassedPageContent />);

    expect(getByDataCy('induction-passed-page')).toBeInTheDocument();
    expect(getByDataCy('page-title')).toHaveTextContent('Assessment passed');
    expect(getByDataCy('summary-text')).toHaveTextContent(
      'All questions answered correctly',
    );
    expect(getByDataCy('what-next-text')).toHaveTextContent(
      'What happens next',
    );
    expect(getByDataCy('account-activation-text')).toHaveTextContent(
      'Your account has been activated. You can now access data through the SDE.',
    );
    expect(getByDataCy('agreement-text')).toHaveTextContent(
      'By entering the SDE, you agree to act according to the NHS England SDE End User Access Agreement (EUAA) (opens in a new window).',
    );
    expect(getByDataCy('agreement-link')).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service/log-in/end-user-access-agreement',
    );
    expect(getByDataCy('portal-button')).toHaveTextContent('Go to SDE Portal');
    expect(getByDataCy('portal-button')).toHaveAttribute('href', '/');
    expect(getByDataCy('feedback-link')).toHaveTextContent(
      'What did you think of the induction (opens in a new window)?',
    );
    expect(getByDataCy('feedback-link')).toHaveAttribute(
      'href',
      'https://forms.office.com/Pages/ResponsePage.aspx?id=slTDN7CF9UeyIge0jXdO43L70IbmepFKuBMbd1ZKLFtUMlBOOFBIUVhLWTlQTjFCSlgyRVhHV0tDSCQlQCN0PWcu',
    );
  });
});
