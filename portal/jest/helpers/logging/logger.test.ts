import { getLogger } from '@/helpers/logging/logger';

const mockPino = jest.fn();
jest.mock('pino', () => {
  return Object.assign(
    (...args: Parameters<typeof mockPino>) => mockPino(...args),
    {
      default: (...args: Parameters<typeof mockPino>) => mockPino(...args),
    },
  );
});

describe('getLogger', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('creates a logger with default level "info" when LOG_LEVEL is not set', () => {
    delete process.env.LOG_LEVEL;

    getLogger('let-it-snow');

    expect(mockPino).toHaveBeenCalledTimes(1);

    const config = mockPino.mock.calls[0][0];

    expect(config).toMatchObject({
      name: 'let-it-snow',
      level: 'info',
    });
  });

  it('uses LOG_LEVEL from environment when present', () => {
    process.env.LOG_LEVEL = 'debug';

    getLogger('let-it-snow');

    const config = mockPino.mock.calls[0][0];

    expect(config.level).toBe('debug');
  });

  it('passes a level formatter that returns expected shape', () => {
    getLogger('let-it-snow');

    const config = mockPino.mock.calls[0][0];

    expect(config.formatters.level('warn')).toEqual({
      level: 'warn',
    });
  });

  it('returns timestamp in expected ISO format', () => {
    const fixedTime = new Date('2020-01-01T12:00:00.000Z');
    jest.spyOn(global.Date, 'now').mockReturnValue(fixedTime.getTime());

    getLogger('let-it-snow');

    const config = mockPino.mock.calls[0][0];

    expect(config.timestamp()).toBe(`,"time":"${fixedTime.toISOString()}"`);
  });

  it('returns whatever pino returns', () => {
    const mockLogger = { info: jest.fn(), error: jest.fn() };
    mockPino.mockReturnValue(mockLogger);

    const result = getLogger('let-it-snow');

    expect(result).toBe(mockLogger);
  });
});
