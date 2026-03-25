import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  AddRoleToUserInAgreement,
  addRoleToUserInAgreement,
  addUserToAgreementAccountGroupInDatabricks,
  createBaseUser,
  CreateOneUser,
  createOneUser,
  createOneUserCommon,
  createOneUserServerActionNoJS,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/serverActions';
import callLambdaWithFullErrorChecking from '@/app/shared/callLambda';
import { mockLogger } from '@/jest/utils';

jest.mock('app/services/hasFeatureFlagEnabled', () => jest.fn());
jest.mock('app/services/hasPermissions', () => jest.fn());
jest.mock('app/shared/callLambda', () => jest.fn());
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/app/shared/logging', () => ({
  getLoggerAndSession: jest.fn(),
}));

describe('createOneUserServerActionNoJS tests', () => {
  const mockSet = jest.fn();
  const mockCookieStore = { set: mockSet };
  const mockRedirect = redirect as unknown as jest.Mock;
  const mockCreateOneUserCommon = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);
    const { getLoggerAndSession } = await import('@/app/shared/logging');
    (getLoggerAndSession as jest.Mock).mockResolvedValue({
      logger: mockLogger,
      session: { user: { email: 'mock@test.com' } },
    });
  });

  it('returns error if final_confirm is missing', async () => {
    const form = new FormData();
    form.set('email', 'test@example.com');

    const result = await createOneUserServerActionNoJS('agreement1', {}, form);

    expect(result).toEqual({
      error: 'You must confirm that these details are correct',
    });
    expect(mockCreateOneUserCommon).not.toHaveBeenCalled();
  });

  it('calls createOneUserCommon and sets cookies on success', async () => {
    mockCreateOneUserCommon.mockResolvedValue(undefined);

    const form = new FormData();
    form.set('email', 'test@test.com');
    form.set('role', 'Analyst');
    form.set('first_name', 'Charlie');
    form.set('last_name', 'Brown');
    form.set('final_confirm', 'true');

    await createOneUserServerActionNoJS('agreement1', {}, form, {
      createOneUserCommon: mockCreateOneUserCommon,
    });

    expect(mockCreateOneUserCommon).toHaveBeenCalledWith(
      'agreement1',
      'test@test.com',
      'Analyst',
      'Charlie',
      'Brown',
    );

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining('manage-users-success'),
      'Charlie Brown added successfully',
      expect.objectContaining({ expires: expect.any(Number) }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining('add-user-form'),
      '',
      { maxAge: 0 },
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      '/agreement/agreement1/manage-users',
    );
  });

  it('returns UNEXPECTED_ERROR if createOneUserCommon throws', async () => {
    mockCreateOneUserCommon.mockRejectedValue(new Error('fail'));

    const form = new FormData();
    form.set('email', 'fail@test.com');
    form.set('role', 'Analyst');
    form.set('first_name', 'Charlie');
    form.set('last_name', 'Brown');
    form.set('final_confirm', 'true');

    const result = await createOneUserServerActionNoJS('agreement1', {}, form, {
      createOneUserCommon: mockCreateOneUserCommon,
    });

    expect(result).toEqual({ error: 'UNEXPECTED_ERROR' });
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe('createOneUserCommon tests', () => {
  const mockCreateOneUser = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    (cookies as jest.Mock).mockReturnValue({ set: jest.fn() });

    const { getLoggerAndSession } = await import('@/app/shared/logging');
    (getLoggerAndSession as jest.Mock).mockResolvedValue({
      logger: mockLogger,
      session: { user: { email: 'mock@test.com' } },
    });

    const hasFeatureFlagEnabled =
      await import('app/services/hasFeatureFlagEnabled');
    (hasFeatureFlagEnabled.default as jest.Mock).mockResolvedValue(true);

    const hasPermissions = await import('app/services/hasPermissions');
    (hasPermissions.default as jest.Mock).mockResolvedValue(true);
  });

  it('throws on invalid input', async () => {
    await expect(createOneUserCommon('', '', '', '', '')).rejects.toThrow(
      'Invalid input',
    );
  });

  it('throws and logs error if feature flag is disabled', async () => {
    const hasFeatureFlagEnabled =
      await import('app/services/hasFeatureFlagEnabled');
    (hasFeatureFlagEnabled.default as jest.Mock).mockResolvedValue(false);

    await expect(
      createOneUserCommon(
        'agreement1',
        'user@test.com',
        'Analyst',
        'Jane',
        'Doe',
      ),
    ).rejects.toThrow('Something went wrong');

    const loggedError = (mockLogger.error as jest.Mock).mock.calls[0][0];

    expect(loggedError).toEqual(
      expect.stringContaining('This feature is disabled'),
    );
  });

  it('throws and logs error if user lacks permission', async () => {
    const hasPermissions = await import('app/services/hasPermissions');
    (hasPermissions.default as jest.Mock).mockResolvedValue(false);

    await expect(
      createOneUserCommon(
        'agreement1',
        'user@test.com',
        'Analyst',
        'Jane',
        'Doe',
      ),
    ).rejects.toThrow('Something went wrong');

    const loggedError = (mockLogger.error as jest.Mock).mock.calls[0][0];

    expect(loggedError).toEqual(
      expect.stringContaining(
        'Requesting user does not have permission to add new users, or email input by user is a data wrangler or support admin',
      ),
    );
  });

  it('correctly calls getLoggerSession and createOneUser and logs positive outcome', async () => {
    const getLoggerAndSession = (await import('@/app/shared/logging'))
      .getLoggerAndSession as jest.Mock;
    (mockCreateOneUser as jest.Mock).mockResolvedValue(undefined);

    await createOneUserCommon(
      'agreement1',
      'user@test.com',
      'Analyst',
      'Jane',
      'Doe',
      { createOneUser: mockCreateOneUser },
    );

    expect(getLoggerAndSession).toHaveBeenCalledWith('createUser', {
      user_to_add: {
        user_email: 'user@test.com',
        role: 'Analyst',
        agreement_id: 'agreement1',
      },
    });
    expect(mockCreateOneUser).toHaveBeenCalledWith(
      expect.objectContaining({
        user_to_add_email: 'user@test.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'Analyst',
        agreement_id: 'agreement1',
        logger: expect.objectContaining({
          info: expect.any(Function),
        }),
      }),
    );

    const infoCalls = (mockLogger.info as jest.Mock).mock.calls;

    expect(infoCalls[0][0]).toBe('Add user requested.');
    expect(infoCalls[1][0]).toBe('Starting create user process for one user');
    expect(infoCalls[2][0]).toBe('Add user success.');
  });
});

describe('createOneUser tests', () => {
  const mockCreateBaseUser = jest.fn();
  const mockAddRoleToUserInAgreement = jest.fn();
  const mockAddUserToAgreementAccountGroupInDatabricks = jest.fn();
  const baseProps: CreateOneUser = {
    user_to_add_email: 'test@test.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'Analyst',
    agreement_id: 'agreement1',
    logger: mockLogger,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const { getLoggerAndSession } = await import('@/app/shared/logging');
    (getLoggerAndSession as jest.Mock).mockResolvedValue({
      logger: mockLogger,
      session: { user: { email: 'test@test.com' } },
    });
  });

  it('calls createBaseUser correctly', async () => {
    const props = {
      ...baseProps,
      deps: {
        createBaseUser: mockCreateBaseUser,
        addRoleToUserInAgreement: mockAddRoleToUserInAgreement,
        addUserToAgreementAccountGroupInDatabricks:
          mockAddUserToAgreementAccountGroupInDatabricks,
      },
    };
    await createOneUser(props);

    expect(mockCreateBaseUser).toHaveBeenCalledWith({
      user_email: 'test@test.com',
      first_name: 'John',
      last_name: 'Doe',
      logger: mockLogger,
    });
  });

  it('adds Analyst role with default fleet', async () => {
    const props = {
      ...baseProps,
      deps: {
        createBaseUser: mockCreateBaseUser,
        addRoleToUserInAgreement: mockAddRoleToUserInAgreement,
        addUserToAgreementAccountGroupInDatabricks:
          mockAddUserToAgreementAccountGroupInDatabricks,
      },
    };
    await createOneUser(props);

    expect(mockAddRoleToUserInAgreement).toHaveBeenCalledWith({
      user_email: 'test@test.com',
      agreement_id: 'agreement1',
      role_name: 'Analyst',
      fleet_type: 'default',
      logger: mockLogger,
      email_type: 'NEW_USER',
    });
  });

  it('adds Analyst role with review_file fleet', async () => {
    const props = {
      ...baseProps,
      agreement_id: 'review_file',
      deps: {
        createBaseUser: mockCreateBaseUser,
        addRoleToUserInAgreement: mockAddRoleToUserInAgreement,
        addUserToAgreementAccountGroupInDatabricks:
          mockAddUserToAgreementAccountGroupInDatabricks,
      },
    };

    await createOneUser(props);

    expect(mockAddRoleToUserInAgreement).toHaveBeenCalledWith({
      user_email: 'test@test.com',
      agreement_id: 'review_file',
      role_name: 'BasicAgreementAccess',
      fleet_type: 'review_file',
      logger: mockLogger,
      email_type: 'NEW_USER',
    });
  });

  it('adds both roles if role is Both', async () => {
    const props = {
      ...baseProps,
      role: 'Both',
      deps: {
        createBaseUser: mockCreateBaseUser,
        addRoleToUserInAgreement: mockAddRoleToUserInAgreement,
        addUserToAgreementAccountGroupInDatabricks:
          mockAddUserToAgreementAccountGroupInDatabricks,
      },
    };

    await createOneUser(props);

    expect(mockAddRoleToUserInAgreement).toHaveBeenCalledWith(
      expect.objectContaining({
        role_name: 'Analyst',
      }),
    );
    expect(mockAddRoleToUserInAgreement).toHaveBeenCalledWith(
      expect.objectContaining({
        role_name: 'UserManager',
      }),
    );
  });

  it('does not call Databricks setup if agreement is skipped', async () => {
    const props = {
      ...baseProps,
      agreement_id: 'review_file',
      deps: {
        createBaseUser: mockCreateBaseUser,
        addRoleToUserInAgreement: mockAddRoleToUserInAgreement,
        addUserToAgreementAccountGroupInDatabricks:
          mockAddUserToAgreementAccountGroupInDatabricks,
      },
    };

    await createOneUser(props);

    expect(
      mockAddUserToAgreementAccountGroupInDatabricks,
    ).not.toHaveBeenCalled();
  });

  it('calls Databricks setup for allowed agreement', async () => {
    const props = {
      ...baseProps,
      agreement_id: 'agreement1',
      deps: {
        createBaseUser: mockCreateBaseUser,
        addRoleToUserInAgreement: mockAddRoleToUserInAgreement,
        addUserToAgreementAccountGroupInDatabricks:
          mockAddUserToAgreementAccountGroupInDatabricks,
      },
    };

    await createOneUser(props);

    expect(mockAddUserToAgreementAccountGroupInDatabricks).toHaveBeenCalledWith(
      {
        user_email: 'test@test.com',
        agreement_id: 'agreement1',
        logger: mockLogger,
      },
    );
  });

  it('logs "Finished create user process"', async () => {
    const props = {
      ...baseProps,
      role_name: 'nonsense_role',
      agreement_id: 'review_file',
    };
    await createOneUser(props);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Finished create user process',
    );
  });
});

describe('createBaseUser tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CREATE_BASE_USER_ARN = 'lalalalalalalambdaaaa';
  });

  it('calls callLambdaWithFullErrorChecking with correct parameters', async () => {
    const payload = {
      user_email: 'test@test.com',
      first_name: 'John',
      last_name: 'Doe',
      logger: mockLogger,
    };

    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue(
      'mock-result',
    );

    const result = await createBaseUser(payload);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith({
      function_name: 'lalalalalalalambdaaaa',
      raw_payload: {
        user_email: 'test@test.com',
        first_name: 'John',
        last_name: 'Doe',
      },
      logger: mockLogger,
      log_result: true,
    });

    expect(result).toBe('mock-result');
  });

  it('throws if callLambdaWithFullErrorChecking throws', async () => {
    const payload = {
      user_email: 'fail@test.com',
      first_name: 'Error',
      last_name: 'Case',
      logger: mockLogger,
    };

    (callLambdaWithFullErrorChecking as jest.Mock).mockRejectedValue(
      new Error('Lambda failed'),
    );

    await expect(createBaseUser(payload)).rejects.toThrow('Lambda failed');
  });
});

describe('addRoleToUserInAgreement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADD_ROLE_TO_USER_IN_AGREEMENT_ARN = 'lalalalalalalambdaaaa';
  });

  const baseProps: AddRoleToUserInAgreement = {
    user_email: 'jane@test.com',
    agreement_id: 'agreement1',
    role_name: 'Analyst',
    email_type: 'NEW_USER',
    fleet_type: 'default',
    logger: mockLogger,
  };

  it('calls Lambda with full payload when fleet_type is provided', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue(
      'mock-success',
    );

    const result = await addRoleToUserInAgreement(baseProps);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith({
      function_name: 'lalalalalalalambdaaaa',
      raw_payload: {
        user_email: 'jane@test.com',
        agreement_id: 'agreement1',
        role_name: 'Analyst',
        email_type: 'NEW_USER',
        fleet_type: 'default',
      },
      logger: mockLogger,
      log_result: true,
    });

    expect(result).toBe('mock-success');
  });

  it('omits fleet_type when not provided', async () => {
    const props = {
      ...baseProps,
      fleet_type: undefined,
    };

    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue(
      'mock-success',
    );

    const result = await addRoleToUserInAgreement(props);

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith({
      function_name: 'lalalalalalalambdaaaa',
      raw_payload: {
        user_email: 'jane@test.com',
        agreement_id: 'agreement1',
        role_name: 'Analyst',
        email_type: 'NEW_USER',
      },
      logger: mockLogger,
      log_result: true,
    });

    expect(result).toBe('mock-success');
  });

  it('throws if Lambda call fails', async () => {
    const props = {
      ...baseProps,
      agreement_id: 'bad_agreement',
    };

    (callLambdaWithFullErrorChecking as jest.Mock).mockRejectedValue(
      new Error('Lambda error'),
    );

    await expect(addRoleToUserInAgreement(props)).rejects.toThrow(
      'Lambda error',
    );
  });
});

describe('addUserToAgreementAccountGroupInDatabricks tests', () => {
  const baseProps = {
    user_email: 'user@test.com',
    agreement_id: 'agreement1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADD_USER_TO_AGREEMENT_ACCOUNT_GROUP_IN_DATABRICKS_ARN =
      'lalalalalalalambdaaaa';
  });

  it('should call callLambdaWithFullErrorChecking with correct parameters', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue('success');

    const result = await addUserToAgreementAccountGroupInDatabricks({
      ...baseProps,
      logger: mockLogger,
    });

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith({
      function_name: 'lalalalalalalambdaaaa',
      raw_payload: baseProps,
      logger: mockLogger,
      log_result: true,
    });

    expect(result).toBe('success');
  });

  it('should propagate errors thrown by callLambdaWithFullErrorChecking', async () => {
    const error = new Error('Lambda call failed');
    (callLambdaWithFullErrorChecking as jest.Mock).mockRejectedValue(error);

    await expect(
      addUserToAgreementAccountGroupInDatabricks({
        ...baseProps,
        logger: mockLogger,
      }),
    ).rejects.toThrow('Lambda call failed');
  });
});
