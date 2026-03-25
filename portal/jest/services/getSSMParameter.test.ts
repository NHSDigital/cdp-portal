import type getSSMParameterType from '@/app/services/getSSMParameter';

describe('getSSMParameter', () => {
  let getSSMParameter: typeof getSSMParameterType;
  let getLogger: jest.Mock;
  let mockSend: jest.Mock;
  const mockGetParameterCommand = jest.fn().mockImplementation((input) => ({
    input,
  }));
  const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

  function InitialiseModuleWithFreshMocks() {
    jest.resetModules();

    jest.doMock('@/helpers/logging/logger', () => ({
      getLogger: jest.fn(() => mockLogger),
    }));

    jest.doMock('@aws-sdk/client-ssm', () => ({
      SSMClient: jest.fn(() => ({ send: mockSend })),
      GetParameterCommand: mockGetParameterCommand,
    }));

    getSSMParameter = require('@/app/services/getSSMParameter').default;
    getLogger = require('@/helpers/logging/logger').getLogger;
  }

  beforeEach(() => {
    mockSend = jest.fn();
    InitialiseModuleWithFreshMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns parameter value when successful', async () => {
    mockSend.mockResolvedValue({ Parameter: { Value: 'test-value' } });

    const return_value = await getSSMParameter({
      parameterName: '/random/param',
    });

    expect(return_value).toBe('test-value');
    expect(mockGetParameterCommand).toHaveBeenCalledWith({
      Name: '/random/param',
    });
    expect(getLogger).toHaveBeenCalledWith('getSSMParameter');
    expect(mockLogger.debug).toHaveBeenCalledWith({
      state: 'Fetching SSM parameter',
      payload: { Name: '/random/param' },
    });
  });

  test('passes WithDecryption when provided', async () => {
    mockSend.mockResolvedValue({ Parameter: { Value: 'test-value' } });

    const return_value = await getSSMParameter({
      parameterName: '/secure/param',
      withDecryption: true,
    });
    expect(return_value).toBe('test-value');
    expect(mockGetParameterCommand).toHaveBeenCalledWith({
      Name: '/secure/param',
      WithDecryption: true,
    });
  });

  test('returns undefined when Parameter is missing', async () => {
    mockSend.mockResolvedValue({
      Parameter: undefined,
    });
    (console.error as jest.Mock) = jest.fn();

    const result = await getSSMParameter({
      parameterName: '/missing/param',
    });

    expect(result).toBeUndefined();
    expect(mockSend).toHaveBeenCalledWith({
      input: { Name: '/missing/param' },
    });
    expect(console.error).toHaveBeenCalledWith({
      state: 'Failed to fetch SSM parameter',
      error: new Error('Parameter not found'),
    });
  });

  test('returns undefined when AWS throws an error', async () => {
    mockSend.mockRejectedValue(new Error('AWS error'));
    (console.error as jest.Mock) = jest.fn();
    const result = await getSSMParameter({
      parameterName: '/error/param',
    });

    expect(result).toBeUndefined();
    expect(mockSend).toHaveBeenCalledWith({ input: { Name: '/error/param' } });
    expect(console.error).toHaveBeenCalledWith({
      state: 'Failed to fetch SSM parameter',
      error: new Error('AWS error'),
    });
  });
});
