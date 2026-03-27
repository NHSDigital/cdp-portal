import { render, screen } from '@testing-library/react';

import SuccessBanner from '@/app/agreement/[agreement_id]/manage-users/_components/successBanner';
import { CookieNames } from '@/config/constants';

const COOKIE_KEY = CookieNames.MANAGE_USERS_SUCCESS_MESSAGE;

describe('Manage User SuccessBanner tests', () => {
  const originalCookie = global.document.cookie;

  afterEach(() => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: originalCookie,
    });
  });

  it('renders banner if cookie exists and then clears the cookie', () => {
    const successMessage = 'User updated successfully';

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `${COOKIE_KEY}=true;`,
    });

    render(<SuccessBanner successMessage={successMessage} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(successMessage)).toBeInTheDocument();

    expect(document.cookie).not.toContain(`${COOKIE_KEY}=true`);
  });

  it('renders nothing if cookie is missing', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    const { container } = render(
      <SuccessBanner successMessage='Should not appear' />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles cookies with leading whitespace correctly', () => {
    const successMessage = 'Whitespace cookie matched';

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `cookie1=abc;  ${COOKIE_KEY}=true;cookie2=xyz`,
    });

    render(<SuccessBanner successMessage={successMessage} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(successMessage)).toBeInTheDocument();
  });
});
