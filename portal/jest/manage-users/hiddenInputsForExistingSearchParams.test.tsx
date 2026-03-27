import { render } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';

import HiddenInputsForExistingSearchParams from '@/app/agreement/[agreement_id]/manage-users/_components/hiddenInputsForExistingSearchParams';
import { queryAllByDataCy } from '@/jest/utils';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('HiddenInputsForExistingSearchParams', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders hidden inputs for all search params except the excluded one', () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({
        status: 'active',
        role: 'admin',
        search: 'Alice',
      }),
    );

    render(<HiddenInputsForExistingSearchParams exclude='role' />);

    const inputs = queryAllByDataCy('hidden-input');
    expect(inputs).toHaveLength(2);

    const expectedInputs = [
      { name: 'status', value: 'active' },
      { name: 'search', value: 'Alice' },
    ];

    expectedInputs.forEach(({ name, value }) => {
      const matchingInput = inputs.find(
        (input) =>
          input.getAttribute('name') === name &&
          input.getAttribute('value') === value &&
          input.getAttribute('type') === 'hidden',
      );
      expect(matchingInput).toBeDefined();
    });
  });

  it('renders nothing when useSearchParams is null', () => {
    (useSearchParams as jest.Mock).mockReturnValue(null);

    const { container } = render(
      <HiddenInputsForExistingSearchParams exclude='anything' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when all params are excluded', () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ only: 'me' }),
    );

    const { container } = render(
      <HiddenInputsForExistingSearchParams exclude='only' />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('handles no search params gracefully', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    const { container } = render(
      <HiddenInputsForExistingSearchParams exclude='none' />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
