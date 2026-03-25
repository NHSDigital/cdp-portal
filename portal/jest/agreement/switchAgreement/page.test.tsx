import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import SwitchAgreementManager from '@/app/agreement/[agreement_id]/switchagreement/_components/SwitchAgreementContent';
import SwitchAgreementPage from '@/app/agreement/[agreement_id]/switchagreement/page';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import getAllAgreements from '@/services/getAllAgreements';
import getUserAgreements from '@/services/getUserAgreements';

jest.mock(
  '@/app/agreement/[agreement_id]/switchagreement/_components/SwitchAgreementContent',
  () => {
    const originalModule = jest.requireActual(
      '@/app/agreement/[agreement_id]/switchagreement/_components/SwitchAgreementContent',
    );
    return {
      __esModule: true,
      ...originalModule,
      default: jest.fn((props) => (
        <div data-testid='switch-agreement-manager-mock'>
          SwitchAgreementManager Mock - Agreement ID: {props.agreement_id}
        </div>
      )),
    };
  },
);
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
jest.mock('@/services/getUserAgreements');

const getUserAgreeentsBody = {
  selectedAgreement: null,
  activeAgreements: [
    { agreement_id: '123', meaningful_name: 'Agreement 123' },
    { agreement_id: '456', meaningful_name: 'Agreement 456' },
  ],
  inductionPassed: false,
  inductionNeeded: true,
};

describe('SwitchAgreementPage tests', () => {
  (getAllAgreements as jest.Mock).mockResolvedValue([
    { agreement_id: 'blah', appstream_desktop_client_enabled: true },
  ]);
  (getUserAgreements as jest.Mock).mockResolvedValue(getUserAgreeentsBody);
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders SwitchAgreementManager', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);

    render(
      await SwitchAgreementPage({
        params: Promise.resolve({ agreement_id: 'blah' }),
      }),
    );

    expect(
      screen.getByText('SwitchAgreementManager Mock - Agreement ID: blah'),
    ).toBeInTheDocument();
    expect(SwitchAgreementManager).toHaveBeenCalledWith(
      expect.objectContaining({
        agreement_id: 'blah',
        agreement_count: 2,
        appstream_desktop_client_enabled: true,
      }),
      {},
    );
  });

  it('redirects to induction page if getInductionRedirectTarget returns /induction', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue('/induction');

    render(
      await SwitchAgreementPage({
        params: Promise.resolve({ agreement_id: 'blah' }),
      }),
    );

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/induction');
  });

  it('no redirect if getInductionRedirectTarget returns null', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);

    render(
      await SwitchAgreementPage({
        params: Promise.resolve({ agreement_id: 'blah' }),
      }),
    );
    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('handles no user session gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);

    render(
      await SwitchAgreementPage({
        params: Promise.resolve({ agreement_id: 'blah' }),
      }),
    );
    expect(getUserAgreements).toHaveBeenCalledWith('');
  });

  it('handles desktop disabled', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getAllAgreements as jest.Mock).mockResolvedValue([
      { agreement_id: 'blah', appstream_desktop_client_enabled: false },
    ]);

    render(
      await SwitchAgreementPage({
        params: Promise.resolve({ agreement_id: 'blah' }),
      }),
    );

    expect(
      screen.getByText('SwitchAgreementManager Mock - Agreement ID: blah'),
    ).toBeInTheDocument();
    expect(SwitchAgreementManager).toHaveBeenCalledWith(
      expect.objectContaining({
        agreement_id: 'blah',
        agreement_count: 2,
        appstream_desktop_client_enabled: false,
      }),
      {},
    );
  });
});
