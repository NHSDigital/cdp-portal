import '@testing-library/jest-dom';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';

import {
  FileSelectionComponent,
  sessionGetter,
} from '@/app/agreement/[agreement_id]/fileupload/_components/FileSelectionComponent';
import { SDE_INPUT_CHECKS_EMAIL } from '@/config/constants';
import { useAsyncError } from '@/helpers/errorHelpers';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({})),
  useParams: () => ({ agreement_id: 'mock-agreement-id' }),
}));

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

jest.mock('nhsuk-react-components', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  ErrorMessage: ({ children }) => <div role='alert'>{children}</div>,
}));

jest.mock('@/helpers/errorHelpers', () => ({
  useAsyncError: jest.fn(),
}));

describe('FileSelectionComponent tests', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (sessionGetter.getSession as jest.Mock).mockResolvedValue({ user: {} });
    (useAsyncError as jest.Mock).mockReturnValue(jest.fn());
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
    jest.clearAllMocks();
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const mockPush = jest.fn();
  test('renders content correctly', () => {
    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    expect(screen.getByText('Upload your file')).toBeInTheDocument();
    expect(
      screen.getByText('You can upload one file at a time.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue to upload' }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/upload your file/i);
    expect(input).toHaveAttribute('type', 'file');
  });

  test('shows an error if no file is selected', async () => {
    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Please choose a file.',
      ),
    );
  });

  test('transitions to validated content when a valid CSV file is selected', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ status: 200 });
    global.fetch = mockFetch;

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['id,name\n1,Test'], 'valid_file.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Before you submit the file',
      ),
    );
    const paragraph = screen
      .getByText(/Check the filename is correct/i)
      .closest('p');
    expect(paragraph).toHaveTextContent(
      'Check the filename is correct. You can upload one file at a time.You will be able to upload another file after submitting',
    );
    expect(screen.getByText('valid_file.csv')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove file' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit file' }),
    ).toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledWith('/api/fileexistscheck', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'valid_file.csv',
        agreementId: 'mock-agreement-id',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  test('shows error message when file exists check fails to call', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['some,data'], 'valid_file.csv', {
      type: 'text/csv',
    });
    fireEvent.change(screen.getByLabelText(/upload your file/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'There was an unexpected error when trying to upload the file.',
      ),
    );
  });

  test('shows "file already being processed" error for check file exists 400 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 400 });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['some,data'], 'valid_file.csv', {
      type: 'text/csv',
    });
    fireEvent.change(screen.getByLabelText(/upload your file/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        `A file with the same name is still being processed. Please email ${SDE_INPUT_CHECKS_EMAIL} if you would like the new file to replace the one being processed.`,
      ),
    );
  });

  test('shows standard error for check file exists non-400 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 418 });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['some,data'], 'valid_file.csv', {
      type: 'text/csv',
    });
    fireEvent.change(screen.getByLabelText(/upload your file/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'There was an unexpected error when trying to upload the file.',
      ),
    );
  });

  test('shows error for empty file', async () => {
    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const badFile = new File([''], 'Invalid File.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [badFile] } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The selected file is empty.',
      ),
    );
  });

  test('shows error for incorrect file type', async () => {
    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const badFile = new File(['nope'], 'Invalid File.png', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [badFile] } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The selected file must be a CSV.',
      ),
    );
  });

  test('shows error for invalid file name', async () => {
    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const badFile = new File(['nope'], 'NOPE!.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [badFile] } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The selected file does not have the correct naming convention. Please refer to our guidance page for information about naming the file correctly.',
      ),
    );
  });

  test('shows correct errors for oversized files', async () => {
    const scenarios = [
      {
        maxFileSize: 1024 ** 3,
        fakeFileSize: 1024 ** 3 + 1,
        expectedText: '1GB',
      },
      {
        maxFileSize: 1024 ** 2,
        fakeFileSize: 1024 ** 2 + 1,
        expectedText: '1MB',
      },
      {
        maxFileSize: 1.5 * 1024 ** 3 + 1,
        fakeFileSize: 2 * 1024 ** 3,
        expectedText: '1.50GB',
      },
      {
        maxFileSize: 1.5 * 1024 ** 2 + 1,
        fakeFileSize: 2 * 1024 ** 2,
        expectedText: '1.50MB',
      },
    ];

    for (const { maxFileSize, fakeFileSize, expectedText } of scenarios) {
      render(<FileSelectionComponent max_file_size_in_bytes={maxFileSize} />);

      const file = new File(['abc'], 'large_boi.csv', { type: 'text/csv' });
      Object.defineProperty(file, 'size', { value: fakeFileSize });

      const input = screen.getByLabelText(/upload your file/i);
      fireEvent.change(input, { target: { files: [file] } });

      fireEvent.click(
        screen.getByRole('button', { name: /continue to upload/i }),
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            new RegExp(`The selected file is larger than ${expectedText}`),
          ),
        ).toBeInTheDocument(),
      );

      cleanup();
    }
  });
  test('redirects to /welcome if user is signed out on file validation', async () => {
    (sessionGetter.getSession as jest.Mock).mockResolvedValue(null);

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/welcome'));
  });

  test('redirects to /welcome if user is signed out on file submission', async () => {
    (sessionGetter.getSession as jest.Mock).mockResolvedValueOnce({ user: {} });
    (sessionGetter.getSession as jest.Mock).mockResolvedValueOnce(null);
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['some,data'], 'valid_file.csv', {
      type: 'text/csv',
    });
    fireEvent.change(screen.getByLabelText(/upload your file/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(
        screen.getByText(/before you submit the file/i),
      ).toBeInTheDocument(),
    );

    const submitButton = screen.getByRole('button', { name: /submit file/i });
    const form = submitButton.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /loading/i }),
      ).toBeInTheDocument(),
    );

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/welcome'));
  });

  test('clears the selected file when Remove File is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const validFile = new File(['id,name\n1,Test'], 'valid_file.csv', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [validFile] } });

    expect(
      screen.getByRole('button', { name: /continue to upload/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(
        screen.getByText(/before you submit the file/i),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove file' }));

    await waitFor(() =>
      expect(screen.getByText(/upload your file/i)).toBeInTheDocument(),
    );

    expect(
      (screen.getByLabelText(/upload your file/i) as HTMLInputElement).files
        ?.length,
    ).toBe(0);
  });

  test('sets loading state and redirects on success', async () => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          url: 'https://s3.fake-upload-url',
          fields: { pumpkin: 'pie' },
        }),
      })
      .mockResolvedValueOnce({ status: 204 });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['id,name\n1,Test'], 'valid_file.csv', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(
        screen.getByText(/before you submit the file/i),
      ).toBeInTheDocument(),
    );

    const submitButton = screen.getByRole('button', { name: /submit file/i });
    const form = submitButton.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /loading/i }),
      ).toBeInTheDocument(),
    );
    expect(mockPush).toHaveBeenCalledWith(
      '/agreement/mock-agreement-id/fileuploadsuccess',
    );
  });

  test('handles non-200 getfileuploadurl response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 418 });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['id,name\n1,Test'], 'valid_file.csv', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(
        screen.getByText(/before you submit the file/i),
      ).toBeInTheDocument(),
    );

    const submitButton = screen.getByRole('button', { name: /submit file/i });
    const form = submitButton.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Get upload URL page returned non 200 status code',
        }),
      );
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/fileexistscheck',
      expect.any(Object),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/getfileuploadurl',
      expect.any(Object),
    );
  });

  test('handles non-204 uploadurl response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({
        status: 200,
        json: jest
          .fn()
          .mockResolvedValue({ url: 'https://s3.fake-upload-url', fields: {} }),
      })
      .mockResolvedValueOnce({ status: 418 });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['id,name\n1,Test'], 'valid_file.csv', {
      type: 'text/csv',
    });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to upload' }));

    await waitFor(() =>
      expect(
        screen.getByText(/before you submit the file/i),
      ).toBeInTheDocument(),
    );

    const submitButton = screen.getByRole('button', { name: /submit file/i });
    const form = submitButton.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Upload returned non 200 status code',
        }),
      );
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/fileexistscheck',
      expect.any(Object),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/getfileuploadurl',
      expect.any(Object),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://s3.fake-upload-url',
      expect.any(Object),
    );
  });

  test('shows generic error message if unexpected error occurs', async () => {
    jest.spyOn(sessionGetter, 'getSession').mockImplementation(() => {
      throw new Error('Terrible things occurred');
    });

    render(<FileSelectionComponent max_file_size_in_bytes={1024 * 1024} />);

    const file = new File(['abc'], 'valid_file.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload your file/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(
      screen.getByRole('button', { name: /continue to upload/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'An unexpected error occurred, please try again.',
      ),
    );
  });
});
