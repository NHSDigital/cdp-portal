import { render, screen } from '@testing-library/react';
import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import { getLogger } from 'helpers/logging/logger';
import { redirect } from 'next/navigation';
import getUserAgreements from 'services/getUserAgreements';

import InductionStartPageContent from '@/app/induction/_components/inductionStartPageContent';
import InductionPage, { generateMetadata } from '@/app/induction/page';
import { getNextUncompletedQuestionNumber } from '@/app/shared/inductionHelpers';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('@/app/shared/inductionHelpers', () => ({
  getNextUncompletedQuestionNumber: jest.fn().mockResolvedValue(3),
  __esModule: true,
}));
jest.mock('app/shared/common', () => ({
  getServerSessionErrorIfMissingProperties: jest.fn().mockResolvedValue({
    user: { email: 'user@example.com' },
  }),
}));
jest.mock('services/getUserAgreements', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('@/app/induction/_components/inductionStartPageContent', () => ({
  __esModule: true,
  default: jest.fn(({ questionNumber }: { questionNumber: number }) => (
    <div data-testid='induction-start-content'>{`Question: ${questionNumber}`}</div>
  )),
}));
jest.mock('helpers/logging/logger', () => ({
  __esModule: true,
  getLogger: jest.fn(() => ({ mockLogger: true })),
}));

describe('InductionPage', () => {
  const mockGetUserAgreements = getUserAgreements as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to home if induction not needed', async () => {
    mockGetUserAgreements.mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: false,
    });

    await InductionPage();

    expect(redirect).toHaveBeenCalledWith('/');
    expect(getLogger).toHaveBeenCalledWith('inductionPage');
  });

  it('redirects to home if induction already passed', async () => {
    mockGetUserAgreements.mockResolvedValueOnce({
      inductionNeeded: true,
      inductionPassed: true,
    });

    await InductionPage();

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('renders the induction content if needed and not yet passed', async () => {
    mockGetUserAgreements.mockResolvedValueOnce({
      inductionNeeded: true,
      inductionPassed: false,
    });

    const result = await InductionPage();

    render(result);

    expect(screen.getByTestId('induction-start-content')).toHaveTextContent(
      'Question: 3',
    );
    expect(InductionStartPageContent).toHaveBeenCalledWith(
      expect.objectContaining({ questionNumber: 3 }),
      {},
    );
    expect(redirect).not.toHaveBeenCalled();
    expect(getNextUncompletedQuestionNumber).toHaveBeenCalled();
    expect(getServerSessionErrorIfMissingProperties).toHaveBeenCalledWith({
      mockLogger: true,
    });
    expect(mockGetUserAgreements).toHaveBeenCalledWith('user@example.com');
  });

  it('calls getNextUncompletedQuestionNumber even if user is redirected', async () => {
    mockGetUserAgreements.mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: false,
    });

    await InductionPage();

    expect(getNextUncompletedQuestionNumber).toHaveBeenCalled();
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Complete the induction assessment - ${whiteLabelValues.acronym}`,
    );
  });
});
