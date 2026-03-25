import { render, screen } from '@testing-library/react';

import ErrorSummary, { Errors } from '@/app/shared/errorSummary';

import { getByDataCy, queryAllByDataCy } from '../utils';

describe('ErrorSummary', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('renders nothing if there are no errors', () => {
    render(<ErrorSummary errors={[]} />);
    const summary = screen.queryByTestId('error-summary');
    expect(summary).toBeNull();
  });

  it('renders errors correctly when provided', () => {
    const errors = [
      { input_id: 'first name', errors_list: ['Required'] },
      { input_id: 'email', errors_list: ['Invalid email'] },
    ];

    render(<ErrorSummary errors={errors} />);

    const summary = getByDataCy('error-summary');
    expect(summary).toBeInTheDocument();

    const links = queryAllByDataCy('error-summary-link');
    expect(links).toHaveLength(2);

    expect(links[0]).toHaveTextContent('Required');
    expect(links[0]).toHaveAttribute('href', '#first-name');

    expect(links[1]).toHaveTextContent('Invalid email');
    expect(links[1]).toHaveAttribute('href', '#email');
  });

  it('renders multiple errors per input correctly', () => {
    const errors = [
      { input_id: 'username', errors_list: ['Required', 'Too short'] },
    ];

    render(<ErrorSummary errors={errors} />);

    const links = queryAllByDataCy('error-summary-link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Required');
    expect(links[1]).toHaveTextContent('Too short');
    expect(links[0]).toHaveAttribute('href', '#username');
    expect(links[1]).toHaveAttribute('href', '#username');
  });

  it('ignores errors with undefined errors_list', () => {
    const errors = [
      { input_id: 'field1', errors_list: undefined },
      { input_id: 'field2', errors_list: ['Required'] },
    ];

    render(<ErrorSummary errors={errors} />);

    const links = queryAllByDataCy('error-summary-link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Required');
    expect(links[0]).toHaveAttribute('href', '#field2');
  });

  describe('document.title', () => {
    it('prefixes "Error:" if there are errors and not already prefixed', () => {
      document.title = 'Page title';
      const errors = [{ input_id: 'f1', errors_list: ['Error'] }];

      render(<ErrorSummary errors={errors} />);
      expect(document.title).toBe('Error: Page title');
    });

    it('does not double-prefix "Error:" if already present', () => {
      document.title = 'Error: Page title';
      const errors = [{ input_id: 'f1', errors_list: ['Error'] }];

      render(<ErrorSummary errors={errors} />);
      expect(document.title).toBe('Error: Page title');
    });

    it('removes "Error:" prefix if there are no errors', () => {
      document.title = 'Error: Page title';
      render(<ErrorSummary errors={[]} />);
      expect(document.title).toBe('Page title');
    });
  });

  it('hits the errors_list === undefined branch', () => {
    const errors = [
      { input_id: 'field1', errors_list: undefined } as unknown as Errors,
    ];

    const filterSpy = jest
      .spyOn(Array.prototype, 'filter')
      .mockImplementation(function () {
        return this as unknown as Errors[];
      });

    render(<ErrorSummary errors={errors} />);

    filterSpy.mockRestore();
  });
});
