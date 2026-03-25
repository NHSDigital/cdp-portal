import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { SelectAgreementPageContent } from '@/app/_components/SelectAgreementPageContent';
import { getWhiteLabelValues } from '@/config/whiteLabel';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));
jest.mock('@/config/whiteLabel', () => ({
  getWhiteLabelValues: jest.fn(),
}));
jest.mock('nhsuk-react-components', () => ({
  WarningCallout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='warning-callout'>{children}</div>
  ),
}));

const agreements = [
  {
    agreement_id: 'martha',
    meaningful_name: 'Test Agreement',
  },
  {
    agreement_id: 'bob',
    meaningful_name: 'Another Agreement',
  },
];

describe('SelectAgreementPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      longName: 'Secure Data Environment',
      acronym: 'SDE',
    });
  });

  it('renders the page heading and search input', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /access an agreement/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/search agreements by name or number/i),
    ).toBeInTheDocument();
  });

  it('renders a table with agreements', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    expect(screen.getByText('Test Agreement')).toBeInTheDocument();
    expect(screen.getByText('Another Agreement')).toBeInTheDocument();
    expect(screen.getByText('MARTHA')).toBeInTheDocument();
    expect(screen.getByText('BOB')).toBeInTheDocument();
  });

  it('filters agreements when searching by name', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    fireEvent.change(
      screen.getByLabelText(/search agreements by name or number/i),
      { target: { value: 'Test' } },
    );

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(screen.getByText('Test Agreement')).toBeInTheDocument();
    expect(screen.queryByText('Another Agreement')).not.toBeInTheDocument();

    expect(
      screen.getByText("1 agreement found matching 'Test'"),
    ).toBeInTheDocument();
  });

  it('shows "no agreements found" message when search has no results', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    fireEvent.change(
      screen.getByLabelText(/search agreements by name or number/i),
      { target: { value: 'does-not-exist' } },
    );

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(
      screen.getByRole('heading', {
        name: /no agreements found matching/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/try searching using different criteria/i),
    ).toBeInTheDocument();
  });

  it('clears the search and restores all agreements', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    fireEvent.change(
      screen.getByLabelText(/search agreements by name or number/i),
      { target: { value: 'Test' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    fireEvent.click(screen.getByRole('link', { name: /clear search/i }));

    expect(screen.getByText('Test Agreement')).toBeInTheDocument();
    expect(screen.getByText('Another Agreement')).toBeInTheDocument();
    expect(
      screen.queryByText(/agreement found matching/i),
    ).not.toBeInTheDocument();
  });

  it('navigates to agreement page when agreement is selected', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Test Agreement' }));

    expect(pushMock).toHaveBeenCalledWith('/agreement/martha/');
  });

  it('shows warning callout when user has no agreements', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={[]}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    expect(screen.getByTestId('warning-callout')).toBeInTheDocument();

    expect(
      screen.getByText(/you aren't a member of any agreements/i),
    ).toBeInTheDocument();
  });

  it('renders white-label acronym in the help text', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    expect(
      screen.getByText(/access your data via the SDE platform/i),
    ).toBeInTheDocument();
  });

  it('does not filter agreements when search input is empty', () => {
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreements}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    fireEvent.change(
      screen.getByLabelText(/search agreements by name or number/i),
      { target: { value: '' } },
    );

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(screen.getByText('Test Agreement')).toBeInTheDocument();
    expect(screen.getByText('Another Agreement')).toBeInTheDocument();

    expect(
      screen.queryByText(/agreement found matching/i),
    ).not.toBeInTheDocument();
  });

  it('handles agreements with no meaningful_name when filtering', () => {
    const agreementsWithoutName = [
      {
        agreement_id: 'no-name',
        meaningful_name: null,
      },
      {
        agreement_id: 'martha',
        meaningful_name: 'Named Agreement',
      },
    ];
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreementsWithoutName}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    fireEvent.change(
      screen.getByLabelText(/search agreements by name or number/i),
      { target: { value: 'no-name' } },
    );

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(screen.getByText('no-name')).toBeInTheDocument();
    expect(screen.getByText('NO-NAME')).toBeInTheDocument();
    expect(screen.queryByText('MARTHA')).not.toBeInTheDocument();
  });

  it('sorts agreements using agreement_id when meaningful_name is missing', () => {
    const agreementsForSorting = [
      {
        agreement_id: 'alfred',
        meaningful_name: null,
      },
      {
        agreement_id: 'monique',
        meaningful_name: 'Named Agreement Monique',
      },
      {
        agreement_id: 'martha',
        meaningful_name: null,
      },
    ];
    render(
      <SelectAgreementPageContent
        agreements_to_display={agreementsForSorting}
        whiteLabelValues={getWhiteLabelValues()}
      />,
    );

    const rows = screen.getAllByRole('row');

    const firstAgreementLink = rows[1].querySelector('a');
    const secondAgreementLink = rows[2].querySelector('a');
    const thirdAgreementLink = rows[3].querySelector('a');

    expect(firstAgreementLink).toHaveTextContent('alfred');
    expect(secondAgreementLink).toHaveTextContent('martha');
    expect(thirdAgreementLink).toHaveTextContent('Named Agreement Monique');
  });
});
