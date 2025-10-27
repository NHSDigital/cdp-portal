import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import CheckboxFilters, {
  CheckboxFiltersProps,
  CheckboxSmallInputField,
  FilterOptionField,
} from '@/app/agreement/[agreement_id]/manage-users/_components/checkboxFilters';
import { CHECKBOX_FILTERS } from '@/app/agreement/[agreement_id]/manage-users/_components/consts';
import useHasJavascript from '@/app/shared/useHasJavascript';

jest.mock('next/navigation', () => {
  const actualNav = jest.requireActual('next/navigation');
  return {
    ...actualNav,
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
    useRouter: jest.fn(),
  };
});
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/_components/hiddenInputsForExistingSearchParams',
  () => ({
    __esModule: true,
    default: () => <div data-testid='hidden-inputs' />,
  }),
);
jest.mock('@/app/shared/useHasJavascript', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
  (usePathname as jest.Mock).mockReturnValue('/users');
  (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
});

describe('CheckboxSmallInputField tests', () => {
  const mockOnChange = jest.fn();

  it('renders checkbox and label', () => {
    render(
      <CheckboxSmallInputField
        label='Option 1'
        button_group='group1'
        button_value='value1'
        default_checked={true}
        onChange={mockOnChange}
      />,
    );

    const input = screen.getByRole('checkbox');
    expect(input).toBeInTheDocument();
    expect(input).toBeChecked();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('triggers onChange callback when clicked', () => {
    render(
      <CheckboxSmallInputField
        label='Option 2'
        button_group='group2'
        button_value='value2'
        default_checked={false}
        onChange={mockOnChange}
      />,
    );

    const input = screen.getByRole('checkbox');
    fireEvent.click(input);
    expect(mockOnChange).toHaveBeenCalled();
  });
});

describe('CheckboxFilters tests', () => {
  const props: CheckboxFiltersProps = {
    whiteLabelKey: 'SDE',
  };
  it('renders all filter groups and options', () => {
    render(<CheckboxFilters {...props} />);

    expect(useHasJavascript).toHaveBeenCalled();

    CHECKBOX_FILTERS.forEach(({ name, options }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      options.forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });
  });
});

describe('FilterOptionField tests', () => {
  it('renders correctly and toggles checked state', () => {
    const { container } = render(
      <FilterOptionField
        name='Test Option'
        id='opt1'
        filter_group_id='filter1'
      />,
    );
    expect(container).toBeInTheDocument();
  });

  it('calls router.replace with correct URL when checked', () => {
    render(
      <FilterOptionField name='Option 1' id='opt1' filter_group_id='filter1' />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /option 1/i }));

    expect(mockReplace).toHaveBeenCalledWith('/users?filter1=opt1', {
      scroll: false,
    });
  });

  it('checkbox is initially checked if URL search params include the filter', () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('filter1=opt1'),
    );

    render(
      <FilterOptionField name='Option 1' id='opt1' filter_group_id='filter1' />,
    );

    const input = screen.getByRole('checkbox', { name: /option 1/i });
    expect(input).toBeChecked();
  });

  it('calls router.replace with param removed when unchecked', () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('filter1=opt1'),
    );
    render(
      <FilterOptionField name='Option 1' id='opt1' filter_group_id='filter1' />,
    );

    const input = screen.getByRole('checkbox', { name: /option 1/i });
    expect(input).toBeChecked();

    fireEvent.click(input);

    expect(mockReplace).toHaveBeenCalledWith('/users?', { scroll: false });
  });

  it('handles when search_params is null or undefined', () => {
    (useSearchParams as jest.Mock).mockReturnValue(null);

    render(
      <FilterOptionField name='Option 1' id='opt1' filter_group_id='filter1' />,
    );

    const input = screen.getByRole('checkbox', { name: /option 1/i });
    fireEvent.click(input);

    expect(mockReplace).toHaveBeenCalledWith('/users?filter1=opt1', {
      scroll: false,
    });
  });
});
