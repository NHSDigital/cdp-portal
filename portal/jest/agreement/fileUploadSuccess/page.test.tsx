import { render, screen } from '@testing-library/react';

import FileUploadSuccessPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/fileuploadsuccess/page';
import { SDE_INPUT_CHECKS_EMAIL } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('@/config/whiteLabel', () => ({
  getWhiteLabelValues: jest.fn(),
}));

describe('FileUploadSuccessPage tests', () => {
  const mockAgreementId = 'pumpkin-spiced-agreement';
  const mockWhiteLabel = {
    acronym: 'SDE',
    longName: 'Secure Data Environment',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getWhiteLabelValues as jest.Mock).mockReturnValue(mockWhiteLabel);
  });

  it('renders page content correctly', async () => {
    const ui = await FileUploadSuccessPage({
      params: Promise.resolve({ agreement_id: mockAgreementId }),
    });
    render(ui);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(mockAgreementId);
    expect(heading).toHaveTextContent('Your file is being checked');

    expect(
      screen.getByText(
        'You will receive a confirmation email once the file has been checked. This should take less than 24 hours.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If there are any technical errors we will tell you what you need to amend.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'What you need to do next',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Information:')).toBeInTheDocument();

    const emailParagraph = screen
      .getByText(/In order for your request to be processed/i)
      .closest('p');

    expect(emailParagraph).not.toBeNull();
    expect(emailParagraph).toHaveTextContent(
      `In order for your request to be processed, please ensure that you now provide contextual information to ${SDE_INPUT_CHECKS_EMAIL}.`,
    );

    const emailLink = emailParagraph?.querySelector('a');
    expect(emailLink).not.toBeNull();
    expect(emailLink).toHaveAttribute(
      'href',
      `mailto:${SDE_INPUT_CHECKS_EMAIL}`,
    );

    expect(
      screen.getByText(
        'This should explain what the data contains and how it will complement other data to help you with your research.',
      ),
    ).toBeInTheDocument();

    const learnMoreLink = screen.getByRole('link', {
      name: 'Learn more about how to send contextual information (opens in a new window).',
    });
    expect(learnMoreLink).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides/import-reference-data#providing-contextual-information',
    );
    expect(learnMoreLink).toHaveAttribute('target', 'blank');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Safe Input Service' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Once we have received your contextual information and checked your uploaded file(s), the Safe Input Service will check for Personally Identifiable Information (PII).',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If your data fails to meet the mandatory criteria, you will receive an email explaining why and how to correct it.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `If it meets the requirements, you will receive an email when the data is ready to use within the ${mockWhiteLabel.longName}.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'We aim to respond to all requests within 5 working days.',
      ),
    ).toBeInTheDocument();
    const finishLink = screen.getByRole('link', { name: /Finish/i });
    expect(finishLink).toBeInTheDocument();
    expect(finishLink).toHaveAttribute('href', `../${mockAgreementId}`);
    expect(finishLink).toHaveClass('nhsuk-button');
    const uploadAnotherLink = screen.getByRole('link', {
      name: /Upload another file/i,
    });
    expect(uploadAnotherLink).toBeInTheDocument();
    expect(uploadAnotherLink).toHaveAttribute('href', './fileupload');
    expect(uploadAnotherLink).toHaveClass(
      'nhsuk-button nhsuk-button--secondary',
    );
  });

  it('returns correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toEqual({
      title: `File upload success - ${mockWhiteLabel.acronym}`,
    });
    expect(getWhiteLabelValues).toHaveBeenCalled();
  });
});
