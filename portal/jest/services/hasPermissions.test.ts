import hasPermissions from '@/app/services/hasPermissions';
import queryPermissionsService from '@/app/services/queryPermissionsService';

jest.mock('@/app/services/queryPermissionsService');

const mockedQueryPermissionsService =
  queryPermissionsService as jest.MockedFunction<
    typeof queryPermissionsService
  >;

describe('hasPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when all required permissions are allowed', async () => {
    mockedQueryPermissionsService.mockResolvedValue({
      status: 200,
      outcome: 'grant',
    });

    const result = await hasPermissions({
      permissions_required: ['read', 'write'],
      agreement_id: 'agreement-123',
      user_email: 'user@test.com',
      target_user: 'target@test.com',
    });

    expect(result).toBe(true);
    expect(mockedQueryPermissionsService).toHaveBeenCalledTimes(2);

    expect(mockedQueryPermissionsService).toHaveBeenNthCalledWith(1, {
      user_email: 'user@test.com',
      action: 'read',
      dsa: 'agreement-123',
      target_user: 'target@test.com',
    });

    expect(mockedQueryPermissionsService).toHaveBeenNthCalledWith(2, {
      user_email: 'user@test.com',
      action: 'write',
      dsa: 'agreement-123',
      target_user: 'target@test.com',
    });
  });

  it('returns false when any permission response has a non-200 status', async () => {
    mockedQueryPermissionsService
      .mockResolvedValueOnce({ status: 200, outcome: 'grant' })
      .mockResolvedValueOnce({ status: 500, outcome: 'grant' });

    const result = await hasPermissions({
      permissions_required: ['read', 'write'],
      agreement_id: 'agreement-123',
      user_email: 'user@test.com',
    });

    expect(result).toBe(false);
    expect(mockedQueryPermissionsService).toHaveBeenCalledTimes(2);
  });

  it('returns false when any permission is denied', async () => {
    mockedQueryPermissionsService
      .mockResolvedValueOnce({ status: 200, outcome: 'grant' })
      .mockResolvedValueOnce({ status: 200, outcome: 'deny' });

    const result = await hasPermissions({
      permissions_required: ['read', 'write'],
      user_email: 'user@test.com',
    });

    expect(result).toBe(false);
  });

  it('handles a single permission correctly', async () => {
    mockedQueryPermissionsService.mockResolvedValue({
      status: 200,
      outcome: 'grant',
    });

    const result = await hasPermissions({
      permissions_required: ['read'],
      user_email: 'user@test.com',
    });

    expect(result).toBe(true);
    expect(mockedQueryPermissionsService).toHaveBeenCalledTimes(1);
  });

  it('passes undefined optional parameters through correctly', async () => {
    mockedQueryPermissionsService.mockResolvedValue({
      status: 200,
      outcome: 'grant',
    });

    await hasPermissions({
      permissions_required: ['read'],
      user_email: 'user@test.com',
    });

    expect(mockedQueryPermissionsService).toHaveBeenCalledWith({
      user_email: 'user@test.com',
      action: 'read',
      dsa: undefined,
      target_user: undefined,
    });
  });
});
