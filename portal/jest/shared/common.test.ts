import { getServerSession } from 'next-auth';
import { Logger } from 'pino';

import * as common from '@/app/shared/common';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger;

describe('logAndError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs the error and throws', () => {
    expect(() => common.logAndError(mockLogger, 'boom')).toThrow('boom');
    expect(mockLogger.error).toHaveBeenCalledWith('boom');
  });
});

describe('getServerSessionErrorIfMissingProperties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the session when it has valid user properties', async () => {
    const session: common.PortalSession = {
      user: { name: 'John', email: 'john@test.com' },
      expires: '2025-12-30T10:00:00.000Z',
    };

    (getServerSession as jest.Mock).mockResolvedValue(session);

    const result = await common.getServerSessionErrorIfMissingProperties(
      mockLogger,
      {},
    );

    expect(result).toEqual(session);
  });

  it('logs and throws if session is missing user properties', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'john@test.com' }, // name missing
    });

    await expect(
      common.getServerSessionErrorIfMissingProperties(mockLogger),
    ).rejects.toThrow(
      'Expected user to be logged in and have a name and email',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Expected user to be logged in and have a name and email',
    );
  });
});

describe('getFormattedRole', () => {
  it('returns undefined when no roles provided', () => {
    expect(common.getFormattedRole(undefined)).toBeUndefined();
  });

  it('returns both roles when both exist', () => {
    expect(common.getFormattedRole(['UserManager', 'Analyst'])).toBe(
      'Both (Data Analyst and User Manager)',
    );
  });

  it('returns user manager', () => {
    expect(common.getFormattedRole(['UserManager'])).toBe('User Manager');
  });

  it('returns data analyst', () => {
    expect(common.getFormattedRole(['Analyst'])).toBe('Data Analyst');
  });

  it('returns undefined for unrelated roles', () => {
    expect(common.getFormattedRole(['OtherRole'])).toBeUndefined();
  });
});

describe('getFormattedTimestamp', () => {
  it('returns formatted timestamp for valid date', () => {
    const ts = '2024-02-01T00:00:00Z';
    expect(common.getFormattedTimestamp(ts)).toBe('1 February 2024');
  });

  it('returns NO_TIMESTAMP_TEXT when timestamp is undefined', () => {
    expect(common.getFormattedTimestamp(undefined)).toBe(
      common.NO_TIMESTAMP_TEXT,
    );
  });
});

describe('getFormattedFleetType', () => {
  it('returns correct labels', () => {
    expect(common.getFormattedFleetType('default')).toBe('4 GB');
    expect(common.getFormattedFleetType('large')).toBe('8 GB');
    expect(common.getFormattedFleetType('xlarge')).toBe('16 GB');
    expect(common.getFormattedFleetType('xxlarge')).toBe('32 GB');
    expect(common.getFormattedFleetType('review_file')).toBe('2 GB');
  });

  it('returns undefined for unknown types', () => {
    expect(common.getFormattedFleetType('weird')).toBeUndefined();
  });
});

describe('redirect_and_force_reload', () => {
  it('can be called with string URL', () => {
    const testUrl = 'https://example.com';
    common.redirect_and_force_reload(testUrl);
  });
});
