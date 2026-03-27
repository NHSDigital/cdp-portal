import parseInductionCookie from '@/app/induction/_components/inductionCookie';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import { getNextUncompletedQuestionNumber } from '@/app/shared/inductionHelpers';

jest.mock('@/app/induction/_components/inductionCookie');

describe('getNextUncompletedQuestionNumber', () => {
  it('returns 1 if cookie_answers is empty or missing', async () => {
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_answers: null,
    });
    const result = await getNextUncompletedQuestionNumber();
    expect(result).toBe(1);
  });

  it('returns first unanswered question number', async () => {
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_answers: {
        '1': [2],
        '2': [1],
      },
    });

    const result = await getNextUncompletedQuestionNumber();
    expect(result).toBe(3);
  });

  it('returns final question in array if all questions are answered', async () => {
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_answers: {
        '1': [2],
        '2': [1],
        '3': [1],
        '4': [2],
        '5': [1],
        '6': [2],
        '7': [1],
        '8': [2],
        '9': [1],
        '10': [2],
      },
    });

    const result = await getNextUncompletedQuestionNumber();
    expect(result).toBe(10);
  });
});

describe('getInductionRedirectTarget', () => {
  it('redirects to induction when feature is enabled, induction needed, and not passed', () => {
    expect(
      getInductionRedirectTarget({
        inductionFeatureFlagEnabled: true,
        inductionNeeded: true,
        inductionPassed: false,
      }),
    ).toBe('/induction');
  });

  it('does not redirect when feature is disabled', () => {
    expect(
      getInductionRedirectTarget({
        inductionFeatureFlagEnabled: false,
        inductionNeeded: true,
        inductionPassed: false,
      }),
    ).toBe(null);
  });

  it('does not redirect when induction is not needed', () => {
    expect(
      getInductionRedirectTarget({
        inductionFeatureFlagEnabled: true,
        inductionNeeded: false,
        inductionPassed: false,
      }),
    ).toBe(null);
  });

  it('does not redirect when induction already passed', () => {
    expect(
      getInductionRedirectTarget({
        inductionFeatureFlagEnabled: true,
        inductionNeeded: true,
        inductionPassed: true,
      }),
    ).toBe(null);
  });
});
