import { getLogger } from 'helpers/logging/logger';
import { headers } from 'next/headers';

import { getServerSessionErrorIfMissingProperties } from '@/app/shared/common';
import { getLoggerAndSession } from '@/app/shared/logging';

const mockChild = jest.fn();
const mockRootLogger = {
  child: mockChild,
};

jest.mock('@/helpers/logging/logger', () => ({
  getLogger: jest.fn(() => mockRootLogger),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/app/shared/common', () => ({
  getServerSessionErrorIfMissingProperties: jest.fn(),
}));

const mockSession = {
  user: { email: 'santa@northpole.com' },
};
(getServerSessionErrorIfMissingProperties as jest.Mock).mockResolvedValue(
  mockSession,
);

describe('getLoggerAndSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns logger with session user and IP', async () => {
    (headers as jest.Mock).mockReturnValue({
      get: jest.fn(() => '123.123.123.123'),
    });
    const mockChildLogger = { info: jest.fn(), error: jest.fn() };
    mockChild.mockReturnValue(mockChildLogger);

    const result = await getLoggerAndSession('egg-nog', {
      extraKey: 'value',
    });

    expect(getLogger).toHaveBeenCalledWith('egg-nog');

    expect(getServerSessionErrorIfMissingProperties).toHaveBeenCalledWith(
      mockRootLogger,
    );

    expect(headers).toHaveBeenCalled();

    expect(mockChild).toHaveBeenCalledWith({
      user_id: 'santa@northpole.com',
      ip_address: '123.123.123.123',
      extraKey: 'value',
    });

    expect(result).toEqual({
      logger: mockChildLogger,
      session: mockSession,
    });
  });

  it('handles missing optionalKeys', async () => {
    (headers as jest.Mock).mockReturnValue({
      get: jest.fn(() => '10.0.0.1'),
    });

    const mockChildLogger = {};
    mockChild.mockReturnValue(mockChildLogger);

    const result = await getLoggerAndSession('candy-cane');

    expect(mockChild).toHaveBeenCalledWith({
      user_id: 'santa@northpole.com',
      ip_address: '10.0.0.1',
    });

    expect(result).toEqual({
      logger: mockChildLogger,
      session: mockSession,
    });
  });
});
