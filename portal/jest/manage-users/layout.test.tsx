import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import React from 'react';

import Page403 from '@/app/(errors)/403/page';
import ManageUsersLayout from '@/app/agreement/[agreement_id]/manage-users/layout';
import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import hasPermissions from '@/app/services/hasPermissions';

jest.mock('next/navigation', () => ({
  _esModule: true,
  notFound: jest.fn(),
}));
jest.mock('next-auth', () => ({
  _esModule: true,
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      email: 'test@test.com',
    },
  }),
}));
jest.mock('react');
jest.mock('@/app/(errors)/403/page', () => {
  const MockPage403 = () => <div>Page403</div>;
  MockPage403.displayName = 'Page403';
  return {
    __esModule: true,
    default: MockPage403,
  };
});
jest.mock('@/config/constants', () => ({
  _esModule: true,
  FeatureFlags: {
    USER_MANAGEMENT: 'user_management',
  },
  Actions: {
    GET_AGREEMENT_USERS: 'get_agreement_users',
  },
}));
jest.mock('@/app/services/hasFeatureFlagEnabled');
jest.mock('@/app/services/hasPermissions');

describe('ManageUsersLayout tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockHasFeatureFlagEnabled = hasFeatureFlagEnabled as jest.Mock;
  const mockHasPermissions = hasPermissions as jest.Mock;

  const props = {
    children: <div>Children</div>,
    params: Promise.resolve({ agreement_id: 'test_agreement' }),
  };

  const expectedHasPermissionsArgs = {
    permissions_required: 'get_agreement_users',
    agreement_id: 'test_agreement',
    user_email: 'test@test.com',
  };

  const expectedFeatureFlagEnabledArgs = {
    featureFlagName: 'user_management',
  };

  it('Calls notFound if featureFlagEnabled is not enabled', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(false);

    await ManageUsersLayout(props);

    expect(mockHasFeatureFlagEnabled).toHaveBeenCalledWith(
      expectedFeatureFlagEnabledArgs,
    );
    expect(notFound).toHaveBeenCalled();
    expect(mockHasPermissions).not.toHaveBeenCalled();
  });

  it('Returns children if user has permission and feature flag is enabled', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(true);
    mockHasPermissions.mockResolvedValue(true);

    const result = await ManageUsersLayout(props);

    expect(notFound).not.toHaveBeenCalled();
    expect(mockHasFeatureFlagEnabled).toHaveBeenCalledWith(
      expectedFeatureFlagEnabledArgs,
    );
    expect(mockHasPermissions).toHaveBeenCalledWith(expectedHasPermissionsArgs);
    expect(result).toEqual(
      <React.Fragment>
        <div>Children</div>
      </React.Fragment>,
    );
  });

  it('Returns Page403 if user does not have permission', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(true);
    mockHasPermissions.mockResolvedValue(false);

    const result = await ManageUsersLayout(props);

    expect(notFound).not.toHaveBeenCalled();
    expect(mockHasFeatureFlagEnabled).toHaveBeenCalledWith(
      expectedFeatureFlagEnabledArgs,
    );
    expect(mockHasPermissions).toHaveBeenCalledWith(expectedHasPermissionsArgs);
    expect(result).toEqual(<Page403 />);
  });

  it('Returns Page403 if user_email is not available', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(true);
    mockHasPermissions.mockResolvedValue(true);

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: null },
    });

    const result = await ManageUsersLayout(props);

    expect(notFound).not.toHaveBeenCalled();
    expect(mockHasFeatureFlagEnabled).toHaveBeenCalledWith(
      expectedFeatureFlagEnabledArgs,
    );
    expect(mockHasPermissions).not.toHaveBeenCalled();
    expect(result).toEqual(<Page403 />);
  });
});
