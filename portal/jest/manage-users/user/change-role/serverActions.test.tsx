import getAgreementUserDetails from 'app/services/getAgreementUserDetails';
import hasPermissions from 'app/services/hasPermissions';
import callLambdaWithFullErrorChecking from 'app/shared/callLambda';
import { logAndError } from 'app/shared/common';
import { getLoggerAndSession } from 'app/shared/logging';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import changeUserRole, {
  ChangeUserRole,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/serverActions';

jest.mock('@/app/services/getAgreementUserDetails');
jest.mock('@/app/services/hasPermissions');
jest.mock('@/app/shared/callLambda');
jest.mock('@/app/shared/logging');
jest.mock('@/app/shared/common');
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
  })),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const props: ChangeUserRole = {
  agreement_id: '123',
  user_to_change_email: 'test@test.com',
  new_role: 'Analyst',
};

describe('changeUserRole tests', () => {
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

  it('returns error if role is not valid', async () => {
    const formData = new FormData();
    formData.set('role', '');
    const testProps = {
      ...props,
      new_role: '',
    };
    const result = await changeUserRole(testProps, {}, formData);

    expect(result).toEqual({ error: 'Select a role' });
  });

  it('throws if user has no permission', async () => {
    const formData = new FormData();
    formData.set('role', 'Analyst');
    (hasPermissions as jest.Mock).mockResolvedValue(false);

    await expect(changeUserRole(props, {}, formData)).rejects.toThrow(
      'Something went wrong',
    );

    expect(logAndError).toHaveBeenCalledWith(
      expect.any(Object),
      'Requesting user does not have permission to change user role',
    );
  });

  it('logs and throws if user has no current roles', async () => {
    const formData = new FormData();
    formData.set('role', 'Analyst');

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: null,
      first_name: 'Test',
      last_name: 'User',
      fleet_type: 'default',
    });

    await expect(changeUserRole(props, {}, formData)).rejects.toThrow(
      'Something went wrong',
    );

    expect(logAndError).toHaveBeenCalledWith(
      expect.any(Object),
      "Couldn't get user's current roles. Unable to change role.",
    );
  });

  it('applies role changes, sets cookie, and redirects on success', async () => {
    const formData = new FormData();
    formData.set('role', 'Analyst');

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['UserManager'],
      first_name: 'Test',
      last_name: 'User',
      fleet_type: 'default',
    });

    await changeUserRole(props, {}, formData);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledTimes(2);
    expect(cookies().set).toHaveBeenCalledWith(
      'sde-manage-users-success-message',
      "Test User's role has been changed to Analyst.",
      expect.any(Object),
    );
    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/user/test@test.com',
    );
  });

  it('logs and throws generic error if something fails', async () => {
    const formData = new FormData();
    formData.set('role', 'Analyst');

    (hasPermissions as jest.Mock).mockRejectedValue(new Error('Boom'));

    await expect(changeUserRole(props, {}, formData)).rejects.toThrow(
      'Something went wrong',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('removes Analyst and adds UserManager when changing from Analyst to UserManager', async () => {
    const formData = new FormData();
    formData.set('role', 'UserManager');

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['Analyst'],
      first_name: 'Test',
      last_name: 'User',
      fleet_type: 'default',
    });

    await changeUserRole(
      {
        ...props,
        new_role: 'UserManager',
      },
      {},
      formData,
    );

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledTimes(2);

    const [removeCall, addCall] = (callLambdaWithFullErrorChecking as jest.Mock)
      .mock.calls;

    expect(removeCall[0].raw_payload.role_name).toBe('Analyst');
    expect(addCall[0].raw_payload.role_name).toBe('UserManager');

    expect(cookies().set).toHaveBeenCalledWith(
      'sde-manage-users-success-message',
      "Test User's role has been changed to User Manager.",
      expect.any(Object),
    );
  });

  it("adds 'UserManager' when user only has 'Analyst' and selects Both", async () => {
    const formData = new FormData();
    formData.set('role', 'Both');

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['Analyst'],
      first_name: 'Alice',
      last_name: 'AnalystOnly',
      fleet_type: 'default',
    });

    await changeUserRole(
      {
        ...props,
        new_role: 'Both',
      },
      {},
      formData,
    );

    const lastCall = (callLambdaWithFullErrorChecking as jest.Mock).mock
      .calls[0];

    expect(lastCall[0].raw_payload.role_name).toBe('UserManager');
    expect(cookies().set).toHaveBeenCalledWith(
      'sde-manage-users-success-message',
      "Alice AnalystOnly's role has been changed to both Analyst and User Manager.",
      expect.any(Object),
    );
  });

  it("adds 'Analyst' when user only has 'UserManager' and selects Both", async () => {
    const formData = new FormData();
    formData.set('role', 'Both');

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['UserManager'],
      first_name: 'Bob',
      last_name: 'ManagerOnly',
      fleet_type: 'default',
    });

    await changeUserRole(
      {
        ...props,
        new_role: 'Both',
      },
      {},
      formData,
    );

    const lastCall = (callLambdaWithFullErrorChecking as jest.Mock).mock
      .calls[0];

    expect(lastCall[0].raw_payload.role_name).toBe('Analyst');
    expect(cookies().set).toHaveBeenCalledWith(
      'sde-manage-users-success-message',
      "Bob ManagerOnly's role has been changed to both Analyst and User Manager.",
      expect.any(Object),
    );
  });

  it("maps 'Analyst' to 'BasicAgreementAccess' when agreement_id is 'review_file'", async () => {
    const formData = new FormData();
    formData.set('role', 'Analyst');

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['UserManager'],
      first_name: 'Review',
      last_name: 'FileUser',
      fleet_type: undefined,
    });

    await changeUserRole(
      { ...props, agreement_id: 'review_file' },
      {},
      formData,
    );

    const [_removeCall, addCall] = (
      callLambdaWithFullErrorChecking as jest.Mock
    ).mock.calls;

    expect(addCall[0].raw_payload.role_name).toBe('BasicAgreementAccess');
  });

  it('returns error if requested role is not a string', async () => {
    const invalidValue = new Blob(['not a string']);

    const formData = new FormData();
    formData.set('role', invalidValue as unknown as string);

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['UserManager'],
      first_name: 'Invalid',
      last_name: 'Type',
      fleet_type: 'default',
    });

    const result = await changeUserRole(props, {}, formData);

    expect(result).toEqual({ error: 'Select a role' });
  });

  it('handles case where new_role is same as old role', async () => {
    const formData = new FormData();
    formData.set('role', 'Both');

    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['UserManager', 'Analyst'],
      first_name: 'No',
      last_name: 'Changes',
      fleet_type: 'default',
    });

    const setCookie = jest.fn();
    (cookies as jest.Mock).mockReturnValue({ set: setCookie });

    const redirectMock = jest.fn();
    jest.mock('next/navigation', () => ({
      redirect: redirectMock,
    }));

    const newProps = {
      ...props,
      new_role: 'Both',
    };

    await changeUserRole(newProps, {}, formData);

    expect(setCookie).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(
        "No Changes's role has been changed to both Analyst and User Manager.",
      ),
      expect.any(Object),
    );
  });

  it('uses "review_file" as fleet_type when agreement_id is review_file and previous_fleet_type is undefined', async () => {
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['Analyst'],
      first_name: 'Review',
      last_name: 'User',
      fleet_type: undefined,
    });

    const formData = new FormData();
    formData.set('role', 'UserManager');

    await changeUserRole(
      { ...props, agreement_id: 'review_file' },
      {},
      formData,
    );

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith(
      expect.objectContaining({
        raw_payload: expect.objectContaining({
          fleet_type: 'review_file',
        }),
      }),
    );
  });

  it('uses "default" as fleet_type when agreement_id is not review_file and previous_fleet_type is undefined', async () => {
    (getAgreementUserDetails as jest.Mock).mockResolvedValue({
      application_roles_agreement: ['Analyst'],
      first_name: 'Default',
      last_name: 'User',
      fleet_type: undefined,
    });

    const formData = new FormData();
    formData.set('role', 'UserManager');

    await changeUserRole(props, {}, formData);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith(
      expect.objectContaining({
        raw_payload: expect.objectContaining({
          fleet_type: 'default',
        }),
      }),
    );
  });
});
