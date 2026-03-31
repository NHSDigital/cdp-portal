import { getWhiteLabelValues } from '@/config/whiteLabel';

describe('getWhiteLabelValues', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns correct values for SDE', () => {
    process.env.PORTAL_SERVICE = 'SDE';

    const result = getWhiteLabelValues();

    expect(result).toEqual({
      acronym: 'SDE',
      longName: 'Secure Data Environment',
    });
  });

  test('returns correct values for CDP', () => {
    process.env.PORTAL_SERVICE = 'CDP';

    const result = getWhiteLabelValues();

    expect(result).toEqual({
      acronym: 'CDP',
      longName: 'Common Data Platform',
    });
  });

  test('throws error when PORTAL_SERVICE is undefined', () => {
    delete process.env.PORTAL_SERVICE;

    expect(() => getWhiteLabelValues()).toThrow('PORTAL_SERVICE is undefined');
  });

  test('throws error for invalid PORTAL_SERVICE value', () => {
    process.env.PORTAL_SERVICE = 'INVALID';

    expect(() => getWhiteLabelValues()).toThrow(
      'Invalid value for PORTAL_SERVICE: INVALID',
    );
  });

  test('handles lowercase env value by converting to uppercase', () => {
    process.env.PORTAL_SERVICE = 'sde';

    const result = getWhiteLabelValues();

    expect(result).toEqual({
      acronym: 'SDE',
      longName: 'Secure Data Environment',
    });
  });
});
