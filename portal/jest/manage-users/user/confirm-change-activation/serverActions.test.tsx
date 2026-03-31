import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import changeActivation, {
  ChangeActivation,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/confirm-change-activation/_components/serverActions';
import getAgreementUserDetails from '@/app/services/getAgreementUserDetails';
import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import hasPermissions from '@/app/services/hasPermissions';
import { callLambdaWithoutFullErrorChecking } from '@/app/shared/callLambda';
import { getLoggerAndSession } from '@/app/shared/logging';

jest.mock('@/app/services/getAgreementUserDetails');
jest.mock('@/app/services/hasFeatureFlagEnabled', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@/app/services/hasPermissions');
jest.mock('@/app/shared/callLambda');
jest.mock('@/app/shared/logging');
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
  })),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const props: ChangeActivation = {
  agreement_id: '123',
  user_to_change_activation_email: 'test@test.com',
  new_activation: true,
};

describe('changeActivation tests', () => {
  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (getLoggerAndSession as jest.Mock).mockResolvedValue({
      logger: mockLogger,
      session: { user: { email: 'admin@test.com' } },
    });

    (cookies as jest.Mock).mockReturnValue({
      set: jest.fn(),
    });
  });

  it('redirects if confirm is No', async () => {
    const formData = new FormData();
    formData.set('confirm', 'No');

    await changeActivation(props, {}, formData);

    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/user/test%40test.com',
    );
  });

  it('returns error if confirm is not Yes after passing initial "No" check', async () => {
    const formData = new FormData();
    formData.set('confirm', '');

    const result = await changeActivation(props, {}, formData);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'User did not select yes on confirm screen',
    );
    expect(result).toEqual({ error: 'Select yes to reactivate this user' });
  });

  it('throws error if feature flag is disabled', async () => {
    (hasFeatureFlagEnabled as jest.Mock).mockResolvedValue(false);
    const formData = new FormData();
    formData.set('confirm', 'Yes');

    await expect(changeActivation(props, {}, formData)).rejects.toThrow(
      'Something went wrong',
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Change user activation requested.',
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Starting change user activation process',
    );
    expect(mockLogger.error).toHaveBeenCalledWith('This feature is disabled');
  });

  it('throws error if user does not have permissions', async () => {
    (hasFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);
    (hasPermissions as jest.Mock).mockResolvedValue(false);
    const formData = new FormData();
    formData.set('confirm', 'Yes');

    await expect(changeActivation(props, {}, formData)).rejects.toThrow(
      'Something went wrong',
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Change user activation requested.',
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Starting change user activation process',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Requesting user does not have permission to change user activation',
    );
  });

  it('calls changeUserActivation and sets cookie on success', async () => {
    (hasFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);
    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['Analyst'],
      first_name: 'Test',
      last_name: 'User',
      fleet_type: 'default',
    });
    const formData = new FormData();
    formData.set('confirm', 'Yes');

    await changeActivation(props, {}, formData);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Change user activation requested.',
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Starting change user activation process',
    );
    expect(callLambdaWithoutFullErrorChecking).toHaveBeenCalledWith(
      expect.objectContaining({
        raw_payload: expect.objectContaining({
          agreement_id: '123',
          new_activation: true,
          user_email: 'test@test.com',
        }),
      }),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Change user activation success.',
    );
    expect(cookies().set).toHaveBeenCalledWith(
      'sde-manage-users-success-message',
      'Test User has been reactivated.',
      { expires: expect.any(Number) },
    );
    expect(redirect).toHaveBeenCalledWith(
      `/agreement/${props.agreement_id}/manage-users`,
    );
  });

  it('displays correct error message when new_activation is false', async () => {
    const formData = new FormData();
    formData.set('confirm', '');

    const result = await changeActivation(
      { ...props, new_activation: false },
      {},
      formData,
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'User did not select yes on confirm screen',
    );
    expect(result).toEqual({ error: 'Select yes to deactivate this user' });
  });

  it('sets correct cookie message for deactivation', async () => {
    (hasFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);
    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['Analyst'],
      first_name: 'Test',
      last_name: 'User',
      fleet_type: 'default',
    });
    const formData = new FormData();
    formData.set('confirm', 'Yes');

    await changeActivation({ ...props, new_activation: false }, {}, formData);
    expect(cookies().set).toHaveBeenCalledWith(
      'sde-manage-users-success-message',
      'Test User has been deactivated.',
      { expires: expect.any(Number) },
    );
  });
});
