import parseInductionCookie, {
  setInductionCookie,
  stringToHash,
} from '@/app/induction/_components/inductionCookie';
import { CookieNames } from '@/config/constants';

jest.mock('next/headers', () => {
  const cookies = {
    store: new Map<string, string>(),
    has: jest.fn((name) => cookies.store.has(name)),
    get: jest.fn((name) => ({ value: cookies.store.get(name) })),
    set: jest.fn((name, value) => cookies.store.set(name, value)),
    clear: () => cookies.store.clear(),
  };
  return { cookies: () => cookies };
});

jest.mock('app/shared/common', () => ({
  getServerSessionErrorIfMissingProperties: jest.fn(async () => ({
    user: { email: 'test@user.com' },
  })),
}));

jest.mock('helpers/logging/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
  })),
}));

describe('inductionCookie tests', () => {
  const { cookies } = require('next/headers');

  const validUserHash = stringToHash('test@user.com');

  beforeEach(() => {
    cookies().clear();
    jest.clearAllMocks();
  });

  describe('stringToHash tests', () => {
    it('should return a SHA-256 hash of the input string', () => {
      const result = stringToHash('hello');
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return consistent hash for same input', () => {
      const hash1 = stringToHash('Hash Browns');
      const hash2 = stringToHash('Hash Browns');
      expect(hash1).toBe(hash2);
    });
  });

  describe('parseInductionCookie tests', () => {
    it('should return empty cookie if no cookie present', async () => {
      cookies().has.mockReturnValue(false);

      const result = await parseInductionCookie();
      expect(result).toEqual({ cookie_answers: {}, cookie_wrong: [] });
    });

    it('should return empty cookie if user hash does not match', async () => {
      cookies().has.mockReturnValue(true);
      cookies().get.mockReturnValue({
        value: JSON.stringify({ user: 'invalidhash' }),
      });

      const result = await parseInductionCookie();
      expect(result).toEqual({ cookie_answers: {}, cookie_wrong: [] });
    });

    it('should parse cookie correctly if user hash matches', async () => {
      cookies().has.mockReturnValue(true);
      cookies().get.mockReturnValue({
        value: JSON.stringify({
          user: validUserHash,
          answers: { q1: [1, 2] },
          wrong: [3],
        }),
      });

      const result = await parseInductionCookie();
      expect(result).toEqual({
        cookie_answers: { q1: [1, 2] },
        cookie_wrong: [3],
      });
    });

    it('should include passed if present in cookie', async () => {
      cookies().has.mockReturnValue(true);
      cookies().get.mockReturnValue({
        value: JSON.stringify({
          user: validUserHash,
          answers: { q1: [1, 2] },
          wrong: [3],
          passed: true,
        }),
      });

      const result = await parseInductionCookie();
      expect(result).toEqual({
        cookie_answers: { q1: [1, 2] },
        cookie_wrong: [3],
        cookie_passed: true,
      });
    });

    it('should use empty object if cookies().get returns undefined', async () => {
      cookies().has.mockReturnValue(true);
      cookies().get.mockReturnValue(undefined);

      const result = await parseInductionCookie();

      expect(result).toEqual({ cookie_answers: {}, cookie_wrong: [] });
    });

    it('should fallback to empty objects and arrays if answers or wrong are missing', async () => {
      cookies().has.mockReturnValue(true);
      cookies().get.mockReturnValue({
        value: JSON.stringify({
          user: validUserHash,
        }),
      });

      const result = await parseInductionCookie();

      expect(result).toEqual({ cookie_answers: {}, cookie_wrong: [] });
    });

    it('should fallback to empty objects and arrays if answers and wrong are null', async () => {
      cookies().has.mockReturnValue(true);
      cookies().get.mockReturnValue({
        value: JSON.stringify({
          user: validUserHash,
          answers: null,
          wrong: null,
        }),
      });

      const result = await parseInductionCookie();

      expect(result).toEqual({ cookie_answers: {}, cookie_wrong: [] });
    });
  });

  describe('setInductionCookie tests', () => {
    it('should set the induction cookie correctly', async () => {
      await setInductionCookie({ q1: [1] }, [2], true);

      expect(cookies().set).toHaveBeenCalledWith(
        CookieNames.INDUCTION,
        expect.stringMatching(/\{.*\}/),
        expect.objectContaining({ expires: expect.any(Number) }),
      );

      const storedCookie = JSON.parse(
        cookies().store.get(CookieNames.INDUCTION),
      );

      expect(storedCookie).toEqual({
        answers: { q1: [1] },
        wrong: [2],
        user: validUserHash,
        passed: true,
      });
    });
  });
});
