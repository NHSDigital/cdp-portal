import getSSMParameter from '@/app/services/getSSMParameter';
import hasFeatureFlagEnabledGivenCookies, {
  hasFeatureFlagEnabledGivenContextReq,
} from '@/app/services/hasFeatureFlagEnabledGivenCookies';

// eslint-disable-next-line no-var
var mockLogger: { info: jest.Mock; error: jest.Mock; debug: jest.Mock };
jest.mock('helpers/logging/logger', () => {
  mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return {
    getLogger: jest.fn(() => mockLogger),
  };
});

jest.mock('@/app/services/getSSMParameter');

describe('hasFeatureFlagEnabledGivenContextReq', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGetSSM = getSSMParameter as jest.Mock;

  test('calls hasFeatureFlagEnabledGivenCookies with correct cookie value', async () => {
    process.env.AWS_ENVIRONMENT_PREFIX = 'test-prefix';
    mockGetSSM.mockResolvedValue('true');
    const context_req = {
      cookies: {
        'FEATURE-FLAG-test-flag': 'true',
      },
    };

    await hasFeatureFlagEnabledGivenContextReq({
      featureFlagName: 'test-flag',
      context_req,
    });

    expect(mockGetSSM).toHaveBeenCalledWith({
      parameterName: '/test-prefixportal/feature-flags/test-flag',
    });
  });
});

describe('hasFeatureFlagEnabledGivenCookies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AWS_ENVIRONMENT_PREFIX;
  });

  const mockGetSSM = getSSMParameter as jest.Mock;

  test('returns true when SSM value is "on"', async () => {
    mockGetSSM.mockResolvedValue('on');

    const result = await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'test-flag',
      ff_cookie_enabled: false,
    });

    expect(result).toBe(true);
  });

  test('returns true when SSM value is "true"', async () => {
    mockGetSSM.mockResolvedValue('true');

    const result = await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: false,
    });

    expect(result).toBe(true);
  });

  test('returns false when SSM value is "off"', async () => {
    mockGetSSM.mockResolvedValue('off');

    const result = await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: false,
    });

    expect(result).toBe(false);
  });

  test('returns false when SSM value is "false"', async () => {
    mockGetSSM.mockResolvedValue('false');

    const result = await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: false,
    });

    expect(result).toBe(false);
  });

  test('returns true when SSM value is "off_without_cookie" and cookie is enabled', async () => {
    mockGetSSM.mockResolvedValue('off_without_cookie');

    const result = await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: true,
    });

    expect(result).toBe(true);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'Feature flag enabled by cookie',
        featureFlagName: 'flag',
      }),
    );
  });

  test('returns false when SSM value is "off_without_cookie" and cookie is not enabled', async () => {
    mockGetSSM.mockResolvedValue('off_without_cookie');

    const result = await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: false,
    });

    expect(result).toBe(false);
  });

  test('logs error + returns false for invalid SSM value', async () => {
    mockGetSSM.mockResolvedValue('INVALID_VALUE');

    const result = await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: false,
    });

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'Invalid feature flag value',
        value: 'INVALID_VALUE',
      }),
    );
  });

  test('uses environment prefix when provided', async () => {
    process.env.AWS_ENVIRONMENT_PREFIX = 'dev-';
    mockGetSSM.mockResolvedValue('true');

    await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: false,
    });

    expect(mockGetSSM).toHaveBeenCalledWith({
      parameterName: '/dev-portal/feature-flags/flag',
    });
  });

  test('uses default prefix when no environment prefix provided', async () => {
    mockGetSSM.mockResolvedValue('true');

    await hasFeatureFlagEnabledGivenCookies({
      featureFlagName: 'flag',
      ff_cookie_enabled: false,
    });

    expect(mockGetSSM).toHaveBeenCalledWith({
      parameterName: '/portal/feature-flags/flag',
    });
  });
});
