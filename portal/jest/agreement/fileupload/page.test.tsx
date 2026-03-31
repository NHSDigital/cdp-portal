import { render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';

import FileUploadPage from '@/app/agreement/[agreement_id]/fileupload/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('@/config/whiteLabel');
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));
describe('FileUploadPage integration tests', () => {
  beforeEach(() => {
    process.env.MAX_UPLOAD_FILE_SIZE_IN_BYTES = '5000000';
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      acronym: 'SDE',
      longName: 'Secure Data Environment',
    });
  });

  it('renders correctly with headings, text, and file selection', async () => {
    const agreement_id = 'Pumpkin Spiced Agreement';
    (useParams as jest.Mock).mockReturnValue({ agreement_id: agreement_id });

    const page = await FileUploadPage({
      params: Promise.resolve({ agreement_id: agreement_id }),
    });
    render(page);

    expect(document.title).toBe(
      'Upload file to Pumpkin Spiced Agreement - SDE',
    );

    const backLink = screen.getByRole('link', { name: 'Go back' });
    expect(backLink).toHaveAttribute('href', `../${agreement_id}`);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pumpkin Spiced Agreement - Import reference data',
    );
    expect(
      screen.getByText(
        'Use this page to upload a reference data file, and request for the data to be added to the Secure Data Environment.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Before you upload',
    );

    const link = screen.getByRole('link', {
      name: /how to prepare your file/i,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides/import-reference-data',
    );
    expect(link).toHaveAttribute('target', 'blank');
    expect(link.closest('p')).toHaveTextContent(
      'Make sure you have followed the guidance on how to prepare your file (opens in a new window)',
    );

    expect(
      screen.getByText(
        'Ensure that the CSV headers and columns/rows meet the formatting requirements',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Uploading a file with the same name will overwrite the original file in the environment',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'To ensure the data is approved it must not contain any Personally Identifiable Information (PII)',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Upload your file')).toBeInTheDocument();
    expect(
      screen.getByText('You can upload one file at a time.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue to upload' }),
    ).toBeInTheDocument();
  });
});
