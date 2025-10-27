import { render, screen } from '@testing-library/react';

import DeleteUserLink from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/deleteUserLink';
import useHasJavascript from '@/app/shared/useHasJavascript';

jest.mock('app/shared/useHasJavascript');

const mockUseHasJavascript = useHasJavascript as jest.Mock;

const defaultProps = {
  agreement_id: 'abc123',
  form_id: 'form456',
  user_id: 'user789',
};

describe('DeleteUserLink tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the JavaScript-enabled delete link when JS is available', () => {
    mockUseHasJavascript.mockReturnValue(true);

    render(<DeleteUserLink {...defaultProps} />);

    const link = screen.getByRole('link', { name: 'Delete' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      '/agreement/abc123/manage-users/add-user/confirm/delete-user?form_id=form456&user_id=user789',
    );
  });

  it('renders the fallback delete link when JS is not available', () => {
    mockUseHasJavascript.mockReturnValue(false);

    render(<DeleteUserLink {...defaultProps} />);

    const link = screen.getByRole('link', { name: 'Delete' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/agreement/abc123/manage-users');
  });
});
