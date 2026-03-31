import { render, screen } from '@testing-library/react';

import { FileSelectionComponent } from '@/app/agreement/[agreement_id]/fileupload/_components/FileSelectionComponent';
import FileUploadClientSidePage from '@/app/agreement/[agreement_id]/fileupload/_components/FileUploadClientSidePage';
import { WhiteLabelEntry } from '@/config/whiteLabel';

jest.mock('nhsuk-react-components', () => ({
  BackLink: ({ children, ...props }) => <a {...props}>{children}</a>,
  WarningCallout: ({ children }) => (
    <div data-testid='warning-callout'>{children}</div>
  ),
}));
jest.mock(
  '@/app/agreement/[agreement_id]/fileupload/_components/FileSelectionComponent',
  () => ({
    FileSelectionComponent: jest.fn(() => (
      <div data-testid='file-selection-component'>File Selection</div>
    )),
  }),
);

describe('FileUploadClientSidePage', () => {
  const mockAgreementId = 'pumpkin-spiced-agreement';
  const mockWhiteLabelValues: WhiteLabelEntry = {
    acronym: 'SDE',
    longName: 'Secure Data Environment',
  };
  const mockProps = {
    agreementId: mockAgreementId,
    max_file_size_in_bytes: 1048576,
    whiteLabelValues: mockWhiteLabelValues,
  };

  beforeEach(() => {
    document.title = '';
    jest.clearAllMocks();
  });

  it('sets the document title based on agreement and acronym', () => {
    render(<FileUploadClientSidePage {...mockProps} />);
    expect(document.title).toBe(`Upload file to ${mockAgreementId} - SDE`);
  });

  it('renders a backlink to the correct agreement URL', () => {
    render(<FileUploadClientSidePage {...mockProps} />);
    const backLink = screen.getByRole('link', { name: /go back/i });
    expect(backLink).toHaveAttribute('href', `../${mockProps.agreementId}`);
  });

  it('renders main heading and descriptive text', () => {
    render(<FileUploadClientSidePage {...mockProps} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Import reference data',
    );
    expect(
      screen.getByText(/Use this page to upload a reference data file/i),
    ).toBeInTheDocument();
  });

  it('renders "Before you upload" section with link to guidance', () => {
    render(<FileUploadClientSidePage {...mockProps} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Before you upload',
    );
    const guideLink = screen.getByRole('link', {
      name: /how to prepare your file/i,
    });
    expect(guideLink).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides/import-reference-data',
    );
    expect(guideLink).toHaveAttribute('target', 'blank');
  });

  it('renders the WarningCallout with all bullet points', () => {
    render(<FileUploadClientSidePage {...mockProps} />);
    const callout = screen.getByTestId('warning-callout');
    expect(callout).toHaveTextContent('Important');
    expect(callout).toHaveTextContent('Ensure that the CSV headers');
    expect(callout).toHaveTextContent('Uploading a file with the same name');
    expect(callout).toHaveTextContent(
      'must not contain any Personally Identifiable Information',
    );
  });

  it('renders FileSelectionComponent with the correct props', () => {
    render(<FileUploadClientSidePage {...mockProps} />);
    expect(FileSelectionComponent).toHaveBeenCalledWith(
      { max_file_size_in_bytes: mockProps.max_file_size_in_bytes },
      {},
    );
    expect(screen.getByTestId('file-selection-component')).toBeInTheDocument();
  });
});
