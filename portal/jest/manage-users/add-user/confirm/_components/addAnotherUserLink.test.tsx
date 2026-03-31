import { render, screen } from '@testing-library/react';
import useHasJavascript from 'app/shared/useHasJavascript';

import AddAnotherUserLink from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/addAnotherUserLink';

jest.mock('@/app/shared/useHasJavascript');
jest.mock('next/link', () => {
  const Link = ({ href, children }) => <a href={href}>{children}</a>;
  Link.displayName = 'NextLinkMock';
  return Link;
});

describe('addAnotherUserLink tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUseHasJavascript = useHasJavascript as jest.Mock;

  const defaultProps = {
    form_id: '123',
    agreement_id: 'abc',
  };

  it('renders the link when JavaScript is enabled', () => {
    mockUseHasJavascript.mockReturnValue(true);

    render(<AddAnotherUserLink {...defaultProps} />);

    const link = screen.getByRole('link', { name: /add another user/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      `/agreement/${defaultProps.agreement_id}/manage-users/add-user?form_id=${defaultProps.form_id}`,
    );
  });

  it('renders nothing when JavaScript is disabled', () => {
    mockUseHasJavascript.mockReturnValue(false);

    const { container } = render(<AddAnotherUserLink {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });
});
