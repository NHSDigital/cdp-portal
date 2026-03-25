jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/helpers/logging/logger', () => ({
  getLogger: jest.fn(() => ({})),
}));

describe('queryPermissionsService', () => {
  const mockLoggerInstance = { debug: jest.fn(), error: jest.fn() };
  jest.resetModules();

  const mockGetLogger = jest.fn(() => mockLoggerInstance);

  jest.doMock('helpers/logging/logger', () => ({
    getLogger: mockGetLogger,
  }));

  beforeEach(() => {
    global.fetch = jest.fn();
    process.env.PERMISSIONS_API_GATEWAY_ID = 'test-gateway';
  });

  afterEach(() => {
    delete process.env.PERMISSIONS_API_GATEWAY_ID;
  });

  it('calls notFound when PERMISSIONS_API_GATEWAY_ID is undefined', async () => {
    delete process.env.PERMISSIONS_API_GATEWAY_ID;

    const { default: queryPermissionsService } =
      await import('@/app/services/queryPermissionsService');
    const { notFound } = await import('next/navigation');

    await expect(
      queryPermissionsService({
        user_email: 'user@test.com',
        action: 'read',
      }),
    ).rejects.toThrow();

    expect(notFound).toHaveBeenCalled();
  });

  it('returns status only when response status is not 200', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 403,
    });

    const { default: queryPermissionsService } =
      await import('@/app/services/queryPermissionsService');

    const result = await queryPermissionsService({
      user_email: 'user@test.com',
      action: 'read',
    });

    expect(result).toEqual({ status: 403 });
  });

  it('returns full permission response on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({
        outcome: 'grant',
        action: 'read',
        dsa: ['agreement-123'],
      }),
    });

    const { default: queryPermissionsService } =
      await import('@/app/services/queryPermissionsService');

    const result = await queryPermissionsService({
      user_email: 'user@test.com',
      action: 'read',
      dsa: 'agreement-123',
      target_user: 'target+user@test.com',
    });

    expect(result).toEqual({
      status: 200,
      outcome: 'grant',
      action: 'read',
      permitted_dsas: ['agreement-123'],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        'action=read&user=user%40test.com&dsa=agreement-123&target_user=target%2Buser%40test.com',
      ),
      { method: 'GET' },
    );

    expect(mockLoggerInstance.debug).toHaveBeenCalled();
  });

  it('handles missing optional parameters correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({
        outcome: 'grant',
        action: 'read',
        dsa: ['*'],
      }),
    });

    const { default: queryPermissionsService } =
      await import('@/app/services/queryPermissionsService');

    await queryPermissionsService({
      user_email: 'user@test.com',
      action: 'read',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('action=read&user=user%40test.com'),
      { method: 'GET' },
    );
  });

  it('logs and throws when fetch throws an error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));

    const { default: queryPermissionsService } =
      await import('@/app/services/queryPermissionsService');

    await expect(
      queryPermissionsService({
        user_email: 'user@test.com',
        action: 'read',
      }),
    ).rejects.toThrow('Error in fetch to permissions API');

    expect(mockLoggerInstance.error).toHaveBeenCalledWith({
      state: 'Error in fetch to permissions API',
      status: 500,
    });
  });
});
