import { cookies } from 'next/headers';

import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import hasFeatureFlagEnabledGivenCookies from '@/app/services/hasFeatureFlagEnabledGivenCookies';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/app/services/hasFeatureFlagEnabledGivenCookies');

describe('hasFeatureFlagEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when cookie value is "true"', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'true' }),
    });
    (hasFeatureFlagEnabledGivenCookies as jest.Mock).mockResolvedValue(true);

    const result = await hasFeatureFlagEnabled({
      featureFlagName: 'TEST_FLAG',
    });

    expect(cookies().get).toHaveBeenCalledWith('FEATURE-FLAG-TEST_FLAG');
    expect(hasFeatureFlagEnabledGivenCookies).toHaveBeenCalledWith({
      featureFlagName: 'TEST_FLAG',
      ff_cookie_enabled: true,
    });
    expect(result).toBe(true);
  });

  it('should return false when cookie value is "false"', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'false' }),
    });
    (hasFeatureFlagEnabledGivenCookies as jest.Mock).mockResolvedValue(false);

    const result = await hasFeatureFlagEnabled({
      featureFlagName: 'TEST_FLAG',
    });

    expect(hasFeatureFlagEnabledGivenCookies).toHaveBeenCalledWith({
      featureFlagName: 'TEST_FLAG',
      ff_cookie_enabled: false,
    });
    expect(result).toBe(false);
  });

  it('should handle missing cookie gracefully', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });
    (hasFeatureFlagEnabledGivenCookies as jest.Mock).mockResolvedValue(false);

    const result = await hasFeatureFlagEnabled({
      featureFlagName: 'TEST_FLAG',
    });

    expect(hasFeatureFlagEnabledGivenCookies).toHaveBeenCalledWith({
      featureFlagName: 'TEST_FLAG',
      ff_cookie_enabled: false,
    });
    expect(result).toBe(false);
  });

  it('should propagate errors from hasFeatureFlagEnabledGivenCookies', async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue({ value: 'true' }),
    });
    (hasFeatureFlagEnabledGivenCookies as jest.Mock).mockRejectedValue(
      new Error('Something went wrong'),
    );

    await expect(
      hasFeatureFlagEnabled({ featureFlagName: 'TEST_FLAG' }),
    ).rejects.toThrow('Something went wrong');
  });
});
