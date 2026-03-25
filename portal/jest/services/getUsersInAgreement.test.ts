import getUsersInAgreement, {
  calculateUserStatus,
  changeBasicAgreementAccessToAnalyst,
} from '@/app/services/getUsersInAgreement';
import callLambdaWithFullErrorChecking from '@/app/shared/callLambda';
import { getLoggerAndSession } from '@/app/shared/logging';
import { createMockUser } from '@/jest/testFactories';

jest.mock('@/app/shared/callLambda');
jest.mock('@/app/shared/logging');

const mockLogger = { error: jest.fn(), info: jest.fn() };

describe('getUsersInAgreement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getLoggerAndSession as jest.Mock).mockResolvedValue({
      logger: mockLogger,
    });
  });

  it('should return users and agreement when lambda call succeeds', async () => {
    const mockResponse = {
      body: JSON.stringify({
        users: [createMockUser()],
        agreement: { meaningful_name: 'Test Agreement' },
      }),
    };

    (callLambdaWithFullErrorChecking as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const result = await getUsersInAgreement('agreement123');

    expect(callLambdaWithFullErrorChecking).toHaveBeenCalledWith(
      expect.objectContaining({
        function_name: process.env.GET_USERS_IN_AGREEMENT_ARN,
        raw_payload: { agreement_id: 'agreement123' },
        logger: mockLogger,
      }),
    );

    expect(result.agreement.meaningful_name).toBe('Test Agreement');
    expect(result.users[0].application_roles_agreement).toContain('Analyst');
    expect(result.users[0].calculated_status).toBe('Activated');
  });

  it('should log error and throw when lambda call fails', async () => {
    (callLambdaWithFullErrorChecking as jest.Mock).mockRejectedValue(
      new Error('Lambda error'),
    );

    await expect(getUsersInAgreement('agreement123')).rejects.toThrow(
      'Error getting all the users in the agreement',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'Error in getUsersInAgreement request',
        status: 500,
        error: expect.any(Error),
      }),
    );
  });
});

describe('changeBasicAgreementAccessToAnalyst', () => {
  it('should replace BasicAgreementAccess with Analyst', () => {
    const user = createMockUser({
      application_roles_agreement: ['BasicAgreementAccess', 'OtherRole'],
    });

    const updatedUser = changeBasicAgreementAccessToAnalyst(user);
    expect(updatedUser.application_roles_agreement).toEqual([
      'Analyst',
      'OtherRole',
    ]);
  });

  it('should leave roles unchanged if BasicAgreementAccess is not present', () => {
    const user = createMockUser({
      application_roles_agreement: ['OtherRole'],
    });

    const updatedUser = changeBasicAgreementAccessToAnalyst(user);
    expect(updatedUser.application_roles_agreement).toEqual(['OtherRole']);
  });

  it('should handle user with no application_roles_agreement (undefined)', () => {
    const user = createMockUser();
    delete user.application_roles_agreement;

    const updatedUser = changeBasicAgreementAccessToAnalyst(user);

    expect(updatedUser.application_roles_agreement).toEqual([]);
  });
});

describe('calculateUserStatus', () => {
  it('should return Deactivated if user is not enabled overall', () => {
    const user = createMockUser({
      enabled_global: false,
      enabled_agreement: true,
    });

    const result = calculateUserStatus(user);
    expect(result.calculated_status).toBe('Deactivated');
  });

  it('should return Pending Induction if user is analyst but induction not passed', () => {
    const user = createMockUser({
      induction: { passed: false },
    });

    const result = calculateUserStatus(user);
    expect(result.calculated_status).toBe('Pending Induction');
  });

  it('should return Activated if user is enabled and induction passed', () => {
    const user = createMockUser({
      induction: { passed: true, passed_timestamp: '2025-01-01' },
    });

    const result = calculateUserStatus(user);
    expect(result.calculated_status).toBe('Activated');
  });

  it('should return Activated if user is enabled overall but not an analyst', () => {
    const user = createMockUser({
      enabled_global: true,
      enabled_agreement: true,
      application_roles_agreement: ['Chief pumpkin carver'],
    });

    const result = calculateUserStatus(user);
    expect(result.calculated_status).toBe('Activated');
  });
});
