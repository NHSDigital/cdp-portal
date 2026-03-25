import * as navigation from 'next/navigation';

import parseInductionCookie from '@/app/induction/_components/inductionCookie';
import InductionFailedPage from '@/app/induction/not-passed/page';
import { QUESTIONS_ARRAY } from '@/app/induction/question/[question_number]/_components/consts';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import * as agreementsModule from '@/services/getUserAgreements';

jest.mock('@/app/induction/_components/inductionCookie');
jest.mock('services/getUserAgreements');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));
jest.mock('app/shared/common', () => ({
  getServerSessionErrorIfMissingProperties: jest.fn(async () => ({
    user: { email: 'test@user.com' },
  })),
}));

describe('InductionNotPassedPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('redirects to home if cookie_wrong length is 0', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: true,
      inductionPassed: false,
    });
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_wrong: [],
    });
    await InductionFailedPage();
    expect(navigation.redirect).toHaveBeenCalledWith('/');
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
  });

  it('redirects to home if inductionNeeded is false', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: false,
      inductionPassed: false,
    });
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_wrong: [3, 7],
    });
    await InductionFailedPage();
    expect(navigation.redirect).toHaveBeenCalledWith('/');
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
  });

  it('redirects to home if inductionPassed is true', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: true,
      inductionPassed: true,
    });
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_wrong: [3, 7],
    });

    await InductionFailedPage();

    expect(navigation.redirect).toHaveBeenCalledWith('/');
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
  });

  it('calls the page content with the correct props', async () => {
    (agreementsModule.default as jest.Mock).mockResolvedValue({
      inductionNeeded: true,
      inductionPassed: false,
    });
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_wrong: [3, 7],
    });

    const result = await InductionFailedPage();

    expect(navigation.redirect).toHaveBeenCalledTimes(0);
    expect(result.props.cookie_wrong).toEqual([3, 7]);
    expect(result.props.wrong_answer_data).toEqual([
      { number: 3, heading: QUESTIONS_ARRAY[2].heading },
      { number: 7, heading: QUESTIONS_ARRAY[6].heading },
    ]);
    expect(result.type.name).toBe('InductionNotPassedPageContent');
  });

  it('calls getLogger with correct label', async () => {
    jest.resetModules();

    const mockLoggerInstance = { info: jest.fn() };
    const mockGetLogger = jest.fn(() => mockLoggerInstance);

    jest.doMock('helpers/logging/logger', () => ({
      getLogger: mockGetLogger,
    }));

    jest.doMock('@/app/induction/_components/inductionCookie', () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue({ cookie_wrong: [1] }),
    }));

    jest.doMock('services/getUserAgreements', () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue({
        inductionNeeded: true,
        inductionPassed: false,
      }),
    }));

    const { default: InductionFailedPage } =
      await import('@/app/induction/not-passed/page');
    const loggerModule = await import('helpers/logging/logger');

    await InductionFailedPage();

    expect(loggerModule.getLogger).toHaveBeenCalledWith('notPassed');
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const { generateMetadata } =
      await import('@/app/induction/not-passed/page');
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Assessment not passed - ${whiteLabelValues.acronym}`,
    );
  });
});
