import { redirect } from 'next/navigation';
import React from 'react';

import ChangeRoleLayout from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/layout';
import hasPermissions from '@/app/services/hasPermissions';
import { getServerSessionErrorIfMissingProperties } from '@/app/shared/common';

jest.mock('@/app/services/hasPermissions');
jest.mock('@/app/shared/common');
jest.mock('helpers/logging/logger', () => ({
  getLogger: jest.fn(() => ({ info: jest.fn(), error: jest.fn() })),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('ChangeRoleLayout tests', () => {
  const mockSession = {
    user: { email: 'user@test.com' },
  };

  const props = {
    children: <div>Child Content</div>,
    params: {
      agreement_id: 'test_agreement',
      user: encodeURIComponent('user@test.com'),
    },
  };

  const expectedHasPermissionsArgs = {
    permissions_required: [
      'user_management.add_analyst',
      'user_management.add_user_manager',
    ],
    agreement_id: 'test_agreement',
    user_email: 'user@test.com',
    target_user: 'user@test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSessionErrorIfMissingProperties as jest.Mock).mockResolvedValue(
      mockSession,
    );
  });

  it('renders children when user has permission', async () => {
    (hasPermissions as jest.Mock).mockResolvedValue(true);

    const result = await ChangeRoleLayout(props);
    expect(result).toEqual(
      <React.Fragment>
        <div>Child Content</div>
      </React.Fragment>,
    );

    expect(hasPermissions).toHaveBeenCalledWith(expectedHasPermissionsArgs);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('Returns Page403 if user does not have permission', async () => {
    (hasPermissions as jest.Mock).mockResolvedValue(false);

    await ChangeRoleLayout(props);

    expect(hasPermissions).toHaveBeenCalledWith(expectedHasPermissionsArgs);
    expect(redirect).toHaveBeenCalledWith('/403');
  });
});
