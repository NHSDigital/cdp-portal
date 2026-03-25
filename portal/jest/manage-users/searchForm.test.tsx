import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';

import SearchForm from '@/app/agreement/[agreement_id]/manage-users/_components/searchForm';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/hiddenInputsForExistingSearchParams',
  () => {
    const MockHiddenInputs = () => <div data-testid='mock-hidden-inputs' />;
    MockHiddenInputs.displayName = 'MockHiddenInputs';
    return MockHiddenInputs;
  },
);

describe('User Management SearchForm tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly without query param', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => '',
    });

    render(<SearchForm />);

    expect(screen.getByTestId('mock-hidden-inputs')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /search by name or email/i }),
    ).toHaveValue('');
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('renders correctly with query param', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'query' ? '  john.doe@example.com  ' : ''),
    });

    render(<SearchForm />);

    expect(screen.getByRole('textbox')).toHaveValue('john.doe@example.com');
  });

  it('handles undefined searchParams gracefully', () => {
    (useSearchParams as jest.Mock).mockReturnValue(null);

    render(<SearchForm />);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
