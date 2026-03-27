import { render } from '@testing-library/react';
import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { redirect } from 'next/navigation';
import React from 'react';

import AddUserLayout from '@/app/agreement/[agreement_id]/manage-users/add-user/layout';
import hasPermissions from '@/app/services/hasPermissions';

jest.mock('app/shared/common', () => ({
  getServerSessionErrorIfMissingProperties: jest.fn(),
}));

jest.mock('@/app/services/hasPermissions');

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('AddUserLayout tests', () => {
  const agreement_id = '123';
  const mockSession = { user: { email: 'test@user.com' } };
  const mockHasPermissions = hasPermissions as jest.Mock;
  const mockGetServerSessionErrorIfMissingProperties =
    getServerSessionErrorIfMissingProperties as jest.Mock;
  mockGetServerSessionErrorIfMissingProperties.mockResolvedValue(mockSession);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /403 if user does not have permission', async () => {
    mockHasPermissions.mockResolvedValue(false);

    const props = {
      children: <div>Nope</div>,
      params: { agreement_id },
    };

    await AddUserLayout(props);

    expect(getServerSessionErrorIfMissingProperties).toHaveBeenCalled();
    expect(hasPermissions).toHaveBeenCalledWith({
      permissions_required: [
        'user_management.add_analyst',
        'user_management.add_user_manager',
      ],
      agreement_id,
      user_email: 'test@user.com',
      target_user: 'NOT_YET_KNOWN',
    });
    expect(redirect).toHaveBeenCalledWith('/403');
  });

  it('renders children if user has permission', async () => {
    mockHasPermissions.mockResolvedValue(true);

    const props = {
      children: <div>YupYupYup</div>,
      params: { agreement_id },
    };

    const result = await AddUserLayout(props);

    expect(getServerSessionErrorIfMissingProperties).toHaveBeenCalled();
    expect(hasPermissions).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    const { container } = render(result as React.ReactElement);
    expect(container).toHaveTextContent('YupYupYup');
  });
});
