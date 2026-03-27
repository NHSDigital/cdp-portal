import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';

import SelectAgreementPage from '@/app/page';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import getAllAgreements from '@/services/getAllAgreements';

jest.mock('@/app/shared/inductionHelpers');
jest.mock('@/services/getAllAgreements');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));
jest.mock('@/app/shared/logging', () => ({
  getLoggerAndSession: jest.fn(() =>
    Promise.resolve({
      logger: { info: jest.fn() },
      session: { user: { email: 'test@email.com' } },
    }),
  ),
}));
jest.mock('@/app/services/hasFeatureFlagEnabled', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@/services/getUserAgreements', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    inductionNeeded: false,
    inductionPassed: false,
    activeAgreements: { blah: { agreement_id: 'blah' } },
  })),
}));
jest.mock('@/app/_components/SelectAgreementPageContent', () => ({
  __esModule: true,
  SelectAgreementPageContent: jest.fn(() => <h1>Select agreement page</h1>),
}));

describe('SelectAgreementPage Induction redirect tests', () => {
  const mockGetInductionRedirectTarget =
    getInductionRedirectTarget as jest.Mock;
  (getAllAgreements as jest.Mock).mockResolvedValue([{ agreement_id: 'blah' }]);
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('User is redirected to induction page if getInductionRedirectTarget returns /induction', async () => {
    mockGetInductionRedirectTarget.mockReturnValue('/induction');

    render(await SelectAgreementPage());

    expect(mockGetInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/induction');
  });

  it('User is not redirected if getInductionRedirectTarget returns null', async () => {
    mockGetInductionRedirectTarget.mockReturnValue(null);

    render(await SelectAgreementPage());

    expect(mockGetInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
