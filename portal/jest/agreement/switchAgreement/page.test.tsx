import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';

import SwitchAgreementPage from '@/app/agreement/[agreement_id]/switchagreement/page';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import getAllAgreements from '@/services/getAllAgreements';

jest.mock('@/app/shared/inductionHelpers');
jest.mock('@/services/getAllAgreements');
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({ user: { email: 'test@email.com' } }),
  ),
}));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
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
jest.mock(
  '@/app/agreement/[agreement_id]/switchagreement/_components.tsx/SwitchAgreementContent',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
);

describe('SwitchAgreementPage Induction redirect tests', () => {
  (getAllAgreements as jest.Mock).mockResolvedValue([{ agreement_id: 'blah' }]);
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('User is redirected to induction page if getInductionRedirectTarget returns /induction', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue('/induction');

    render(await SwitchAgreementPage({ params: { agreement_id: 'blah' } }));

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/induction');
  });

  it('User is not redirected if getInductionRedirectTarget returns null', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);

    render(await SwitchAgreementPage({ params: { agreement_id: 'blah' } }));

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
