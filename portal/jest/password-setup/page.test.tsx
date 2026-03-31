import { render, screen, within } from '@testing-library/react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as React from 'react';

import { verifyEmailAndGUID } from '@/app/(password-setup)/set-up-password/_components/serverActions';
import SetUpPasswordPage, {
  generateMetadata,
} from '@/app/(password-setup)/set-up-password/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import { checkAccessibility, getByDataCy } from '@/jest/utils';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});
jest.mock(
  '@/app/(password-setup)/set-up-password/_components/serverActions',
  () => ({
    verifyEmailAndGUID: jest.fn(),
  }),
);
jest.mock('helpers/logging/logger', () => ({
  getLogger: jest.fn().mockReturnValue({
    warn: jest.fn(),
  }),
}));

const whiteLabelValues = getWhiteLabelValues();

describe('SetUpPasswordPage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (React.useActionState as jest.Mock).mockImplementation(
      (_action, initialState) => {
        return [initialState, jest.fn(), false];
      },
    );
  });

  it('should render page content when searchParams are valid', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({ value: 'user@test.com' }),
    });
    (verifyEmailAndGUID as jest.Mock).mockResolvedValue(true);

    const { container } = render(
      await SetUpPasswordPage({ searchParams: Promise.resolve({ id: 'abc' }) }),
    );

    expect(
      screen.getByRole('heading', { name: /Set up password/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Once you set your password you can sign into the ${whiteLabelValues.acronym} portal.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Your password must:')).toBeInTheDocument();
    expect(screen.getByText('have 14 characters or more')).toBeInTheDocument();
    expect(
      screen.getByText('have at least one lowercase and one uppercase letter'),
    ).toBeInTheDocument();
    expect(screen.getByText('have at least one number')).toBeInTheDocument();
    expect(
      screen.getByText('have at least one special character such as ?!@”'),
    ).toBeInTheDocument();
    expect(screen.getByText('Your password must not:')).toBeInTheDocument();
    expect(
      screen.getByText('be the same as a previous password'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'have repeating characters next to each other such as 11 or aa',
      ),
    ).toBeInTheDocument();

    // error summary should not be present
    expect(() => getByDataCy('error-summary-link')).toThrow();
    expect(() => getByDataCy('error-summary')).toThrow();

    //visible inputs
    expect(screen.getByLabelText('Enter password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();

    //hidden, pre-populated inputs
    const emailInput = document.querySelector(
      'input[name="user_email"][type="hidden"]',
    );
    const guidInput = document.querySelector(
      'input[name="guid"][type="hidden"]',
    );

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('value', 'user@test.com');
    expect(guidInput).toHaveAttribute('value', 'abc');

    // Continue button
    expect(getByDataCy('submit-button')).toBeInTheDocument();

    // accessibility check
    await checkAccessibility(container);
  });

  it('exports correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Set up password - ${whiteLabelValues.acronym}`,
    );
  });

  it('should redirect if email is missing', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => undefined,
    });

    await SetUpPasswordPage({ searchParams: Promise.resolve({ id: '123' }) });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('should redirect if id is missing', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({ value: 'user@test.com' }),
    });

    await SetUpPasswordPage({ searchParams: Promise.resolve({}) });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('should redirect if verifyEmailAndGUID returns false', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({ value: 'user@test.com' }),
    });
    (verifyEmailAndGUID as jest.Mock).mockResolvedValue(false);

    await SetUpPasswordPage({ searchParams: Promise.resolve({ id: 'abc' }) });

    expect(verifyEmailAndGUID).toHaveBeenCalledWith('user@test.com', 'abc');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('displays errors when present', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: () => ({ value: 'user@test.com' }),
    });
    (verifyEmailAndGUID as jest.Mock).mockResolvedValue(true);
    (React.useActionState as jest.Mock).mockImplementation(() => [
      {
        errors: {
          enter_password: ['Not that one, you used that one back in 1962'],
          confirm_password: ['Too secure, try again'],
        },
      },
      jest.fn(),
      false,
    ]);

    const { container } = render(
      await SetUpPasswordPage({ searchParams: Promise.resolve({ id: 'abc' }) }),
    );

    const errorSummary = await screen.findByRole('alert');
    expect(errorSummary).toBeInTheDocument();
    expect(
      errorSummary.contains(
        screen.getByRole('heading', { name: /There is a problem/i }),
      ),
    ).toBe(true);

    const passwordLink = within(errorSummary).getByRole('link', {
      name: /Not that one, you used that one back in 1962/,
    });
    expect(passwordLink).toBeInTheDocument();
    expect(passwordLink).toHaveAttribute('href', '#enter_password-input');

    const confirmPasswordLink = within(errorSummary).getByRole('link', {
      name: /Too secure, try again/,
    });
    expect(confirmPasswordLink).toBeInTheDocument();
    expect(confirmPasswordLink).toHaveAttribute(
      'href',
      '#confirm_password-input',
    );

    const passwordInput = screen.getByLabelText(/Enter password/);
    expect(passwordInput).toHaveClass('nhsuk-input--error');
    expect(passwordInput).toHaveAttribute('aria-describedby');
    const pwFormGroup = passwordInput.closest('.nhsuk-form-group');
    expect(pwFormGroup).toHaveTextContent(
      /Not that one, you used that one back in 1962/,
    );

    const confirmPasswordInput = screen.getByLabelText(/Confirm password/);
    expect(confirmPasswordInput).toHaveClass('nhsuk-input--error');
    expect(confirmPasswordInput).toHaveAttribute('aria-describedby');
    const cpwFormGroup = confirmPasswordInput.closest('.nhsuk-form-group');
    expect(cpwFormGroup).toHaveTextContent(/Too secure, try again/);

    await checkAccessibility(container);
  });
});
