import * as navigation from 'next/navigation';

import parseInductionCookie from '@/app/induction/_components/inductionCookie';
import InductionPassedPage from '@/app/induction/passed/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('@/app/induction/_components/inductionCookie');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

describe('InductionPassedPageContent tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('redirects to home if cookie_passed is false', async () => {
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_passed: false,
    });
    await InductionPassedPage();
    expect(navigation.redirect).toHaveBeenCalledWith('/');
    expect(navigation.redirect).toHaveBeenCalledTimes(1);
  });

  it('calls the page content', async () => {
    (parseInductionCookie as jest.Mock).mockResolvedValue({
      cookie_passed: true,
    });

    const result = await InductionPassedPage();

    expect(navigation.redirect).toHaveBeenCalledTimes(0);
    expect(result.type.name).toBe('InductionPassedPageContent');
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const { generateMetadata } = await import('@/app/induction/passed/page');
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Assessment passed - ${whiteLabelValues.acronym}`,
    );
  });
});
