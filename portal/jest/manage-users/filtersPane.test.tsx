import { render, screen } from '@testing-library/react';

import FiltersPane from '@/app/agreement/[agreement_id]/manage-users/_components/filtersPane';

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/selectedFilters',
  () => {
    const Component = () => (
      <div data-testid='selected-filters'>SelectedFilters</div>
    );
    Component.displayName = 'SelectedFilters';
    return Component;
  },
);

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/searchForm',
  () => {
    const Component = () => <div data-testid='search-form'>SearchForm</div>;
    Component.displayName = 'SearchForm';
    return Component;
  },
);

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/checkboxFilters',
  () => {
    const Component = () => (
      <div data-testid='checkbox-filters'>CheckboxFilters</div>
    );
    Component.displayName = 'CheckboxFilters';
    return Component;
  },
);

describe('FiltersPane tests', () => {
  it('renders the heading and all filter sections', () => {
    render(<FiltersPane />);

    expect(
      screen.getByRole('heading', { name: 'Filters' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('search-form')).toBeInTheDocument();
    expect(screen.getByTestId('selected-filters')).toBeInTheDocument();
    expect(screen.getByTestId('search-form')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-filters')).toBeInTheDocument();
  });
});
