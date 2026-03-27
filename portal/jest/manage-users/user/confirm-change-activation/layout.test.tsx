import { redirect } from 'next/navigation';
import React from 'react';

import ConfirmChangeActivationLayout from '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/layout';
import hasPermissions from '@/app/services/hasPermissions';
import { getServerSessionErrorIfMissingProperties } from '@/app/shared/common';

jest.mock('@/app/services/hasPermissions');
jest.mock('@/app/shared/common');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('helpers/logging/logger', () => ({
  getLogger: () => ({ info: jest.fn(), error: jest.fn() }),
}));

describe('ConfirmChangeActivationLayout tests', () => {
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
    permissions_required: ['user_management.change_agreement_user_activation'],
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

    const result = await ConfirmChangeActivationLayout(props);
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

    await ConfirmChangeActivationLayout(props);

    expect(hasPermissions).toHaveBeenCalledWith(expectedHasPermissionsArgs);
    expect(redirect).toHaveBeenCalledWith('/403');
  });
});
