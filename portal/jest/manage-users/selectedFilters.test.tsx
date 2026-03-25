import { render, screen } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';

import { CHECKBOX_FILTERS } from '@/app/agreement/[agreement_id]/manage-users/_components/consts';
import SelectedFilters from '@/app/agreement/[agreement_id]/manage-users/_components/selectedFilters';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const createMockSearchParams = (params: {
  get?: (key: string) => string;
  getAll?: (key: string) => string[];
  toString?: () => string;
}) => ({
  get: params.get || (() => ''),
  getAll: params.getAll || (() => []),
  toString: params.toString || (() => ''),
});

describe('User Management SelectedFilters tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles null pathname gracefully in main component', () => {
    (usePathname as jest.Mock).mockReturnValue(null);
    (useSearchParams as jest.Mock).mockReturnValue(
      createMockSearchParams({
        get: () => 'search',
        getAll: () => [],
      }),
    );
    render(<SelectedFilters />);
    expect(screen.getByText('search')).toBeInTheDocument();
  });

  it('handles null pathname gracefully in SelectedFilterBox', () => {
    const filterId = CHECKBOX_FILTERS[0].id;
    const option = CHECKBOX_FILTERS[0].options[0];

    (usePathname as jest.Mock).mockReturnValue(null);
    (useSearchParams as jest.Mock).mockReturnValue(
      createMockSearchParams({
        get: () => '',
        getAll: (key: string) => (key === filterId ? [option.id] : []),
        toString: () => `${filterId}=${option.id}`,
      }),
    );

    render(<SelectedFilters />);

    const link = screen.getByLabelText(`Remove ${option.name}`);
    expect(link).toHaveAttribute('href', '');
  });

  it('renders nothing if useSearchParams returns null', () => {
    (usePathname as jest.Mock).mockReturnValue('/manage-users');
    (useSearchParams as jest.Mock).mockReturnValue(null);
    const { container } = render(<SelectedFilters />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing if no query and no filters are selected', () => {
    (usePathname as jest.Mock).mockReturnValue('/manage-users');
    (useSearchParams as jest.Mock).mockReturnValue(
      createMockSearchParams({
        get: () => '',
        getAll: () => [],
      }),
    );

    const { container } = render(<SelectedFilters />);
    expect(container.firstChild).toBeNull();
  });

  it('renders selected query if present', () => {
    (usePathname as jest.Mock).mockReturnValue('/manage-users');
    (useSearchParams as jest.Mock).mockReturnValue(
      createMockSearchParams({
        get: (key: string) => (key === 'query' ? 'search term' : ''),
        getAll: () => [],
      }),
    );

    render(<SelectedFilters />);
    expect(screen.getByText('Selected filters')).toBeInTheDocument();
    expect(screen.getByText('Text search')).toBeInTheDocument();
    expect(screen.getByText('search term')).toBeInTheDocument();
  });

  it('renders selected filter options if present', () => {
    const filterId = CHECKBOX_FILTERS[0].id;
    const optionId = CHECKBOX_FILTERS[0].options[0].id;
    const optionName = CHECKBOX_FILTERS[0].options[0].name;

    (usePathname as jest.Mock).mockReturnValue('/manage-users');
    (useSearchParams as jest.Mock).mockReturnValue(
      createMockSearchParams({
        get: () => '',
        getAll: (key: string) => (key === filterId ? [optionId] : []),
      }),
    );

    render(<SelectedFilters />);

    expect(screen.getByText('Selected filters')).toBeInTheDocument();
    expect(screen.getByText(CHECKBOX_FILTERS[0].name)).toBeInTheDocument();
    expect(screen.getByText(optionName)).toBeInTheDocument();
  });

  it('renders both query and filters when both present', () => {
    const filterId = CHECKBOX_FILTERS[0].id;
    const optionId = CHECKBOX_FILTERS[0].options[0].id;
    const optionName = CHECKBOX_FILTERS[0].options[0].name;

    (usePathname as jest.Mock).mockReturnValue('/manage-users');
    (useSearchParams as jest.Mock).mockReturnValue(
      createMockSearchParams({
        get: (key: string) => (key === 'query' ? 'combo' : ''),
        getAll: (key: string) => (key === filterId ? [optionId] : []),
      }),
    );

    render(<SelectedFilters />);

    expect(screen.getByText('combo')).toBeInTheDocument();
    expect(screen.getByText(optionName)).toBeInTheDocument();
  });

  it('removes param and generates base URL with no query string', () => {
    const filterId = CHECKBOX_FILTERS[0].id;
    const option = CHECKBOX_FILTERS[0].options[0];

    (usePathname as jest.Mock).mockReturnValue('/manage-users');
    (useSearchParams as jest.Mock).mockReturnValue(
      createMockSearchParams({
        get: () => '',
        getAll: (key: string) => (key === filterId ? [option.id] : []),
        toString: () => `${filterId}=${option.id}`,
      }),
    );

    render(<SelectedFilters />);

    const link = screen.getByRole('link', { name: `Remove ${option.name}` });
    expect(link).toHaveAttribute('href', '/manage-users');
  });
});
