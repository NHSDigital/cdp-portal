import { render, screen, within } from '@testing-library/react';
import * as React from 'react';

import ConfirmEmailAddressPage, {
  generateMetadata,
} from '@/app/(password-setup)/confirm-email-address/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import { checkAccessibility, getByDataCy } from '@/jest/utils';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('ConfirmEmailAddressPage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockImplementation(
      (_action, initialState) => {
        return [initialState, jest.fn(), false];
      },
    );
  });

  it('renders confirm email address page correctly', async () => {
    const { container } = render(
      await ConfirmEmailAddressPage({
        searchParams: Promise.resolve({ id: '123456' }),
      }),
    );

    expect(
      screen.getByRole('heading', { name: /Confirm your email address/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Enter your email address/),
    ).toBeInTheDocument();
    expect(document.getElementById('email_address-input')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue/ }),
    ).toBeInTheDocument();

    expect(() => getByDataCy('error-summary-link')).toThrow();
    expect(() => getByDataCy('error-summary')).toThrow();

    await checkAccessibility(container);
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Confirm email address - ${whiteLabelValues.acronym}`,
    );
  });

  it('redirects to home if no id in search params', async () => {
    const mockRedirect = jest.spyOn(require('next/navigation'), 'redirect');
    render(
      await ConfirmEmailAddressPage({
        searchParams: Promise.resolve({}),
      }),
    );
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('shows error summary when there is an error', async () => {
    (React.useActionState as jest.Mock).mockImplementation(() => [
      {
        error: 'Terrible no good things have happened.',
      },
      jest.fn(),
      false,
    ]);

    const { container } = render(
      await ConfirmEmailAddressPage({
        searchParams: Promise.resolve({ id: '123456' }),
      }),
    );

    const errorSummary = await screen.findByRole('alert');
    expect(errorSummary).toBeInTheDocument();
    expect(
      errorSummary.contains(
        screen.getByRole('heading', { name: /There is a problem/i }),
      ),
    ).toBe(true);

    const errorLink = within(errorSummary).getByRole('link', {
      name: /Terrible no good things have happened./,
    });
    expect(errorLink).toBeInTheDocument();
    expect(errorLink).toHaveAttribute('href', '#email_address-input');

    const emailInput = screen.getByLabelText(/Enter your email address/);
    expect(emailInput).toHaveClass('nhsuk-input--error');
    expect(emailInput).toHaveAttribute('aria-describedby');
    const fnFormGroup = emailInput.closest('.nhsuk-form-group');
    expect(fnFormGroup).toHaveTextContent(
      /Terrible no good things have happened./,
    );

    await checkAccessibility(container);
  });
});
