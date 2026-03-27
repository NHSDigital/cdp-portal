import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import getCardColumnWidth from '@/app/agreement/[agreement_id]/_components/getCardColumnWidth';
import { ServiceCard } from '@/app/agreement/[agreement_id]/_components/ServiceCard';
import AgreementPage from '@/app/agreement/[agreement_id]/page';
import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import hasPermissions from '@/app/services/hasPermissions';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import getUserAgreements from '@/services/getUserAgreements';

jest.mock('@/app/agreement/[agreement_id]/_components/ServiceCard', () => ({
  ServiceCard: jest.fn((props) => (
    <div data-testid='service-card' {...props} />
  )),
}));
jest.mock('@/app/agreement/[agreement_id]/_components/getCardColumnWidth');
jest.mock('@/app/shared/inductionHelpers');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { email: 'test@email.com' },
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
    activeAgreements: [{ agreement_id: 'blah' }],
  })),
}));
jest.mock('@/app/_components/SelectAgreementPageContent', () => ({
  __esModule: true,
  SelectAgreementPageContent: jest.fn(() => <h1>Select agreement page</h1>),
}));
jest.mock('@/config/constants', () => ({
  __esModule: true,
  Permissions: {
    OPEN_AGREEMENT: 'vdi.open_agreement',
    UPLOAD_FILE: 'data_in.upload_file',
    GET_AGREEMENT_USERS: 'user_management.get_agreement_users',
  },
  FeatureFlags: {
    INDUCTION: 'induction',
    USER_MANAGEMENT: 'user_management',
  },
}));
jest.mock('@/app/services/hasPermissions', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(true)),
}));

const agreement_id = 'test-agreement';
const sde_agreement_id = 'dsa-agreement';

describe('AgreementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects when getInductionRedirectTarget returns a path', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue('/induction');

    await render(
      await AgreementPage({ params: { agreement_id: 'test-agreement' } }),
    );

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/induction');
  });

  it('does not redirect when getInductionRedirectTarget returns null', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);

    await render(
      await AgreementPage({ params: { agreement_id: 'test-agreement' } }),
    );

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders page content for non-sde agreement as expected', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getUserAgreements as jest.Mock).mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: false,
      activeAgreements: [
        { agreement_id: agreement_id },
        { agreement_id: 'another-agreement' },
      ],
    });

    render(await AgreementPage({ params: { agreement_id: agreement_id } }));

    expect(screen.getByText('Go back')).toBeInTheDocument();
    expect(
      screen.getByText('Secure Data Environment (SDE) Portal'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Access your online services for ${agreement_id}`),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('service-card')).toHaveLength(3);
  });

  it('renders page content for sde agreement as expected', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getUserAgreements as jest.Mock).mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: false,
      activeAgreements: [
        { agreement_id: agreement_id },
        { agreement_id: sde_agreement_id },
      ],
    });

    render(await AgreementPage({ params: { agreement_id: sde_agreement_id } }));

    expect(screen.getByText('Go back')).toBeInTheDocument();
    expect(
      screen.getByText('Secure Data Environment (SDE) Portal'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Access your online services for ${sde_agreement_id}`),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('service-card')).toHaveLength(4);
  });

  it('passes correct props to ServiceCard for all cards and sets correct column width for non-sde agreement', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (hasFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);
    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getCardColumnWidth as jest.Mock).mockReturnValue(
      'nhsuk-grid-column-one-third',
    );

    await render(
      await AgreementPage({ params: { agreement_id: agreement_id } }),
    );

    const serviceCardCount = screen.getAllByTestId('service-card');
    expect(serviceCardCount.length).toBe(3);

    const expectedColumnWidth = 'nhsuk-grid-column-one-third';
    const calls = (ServiceCard as jest.Mock).mock.calls;

    expect(calls.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Manage users',
          width: expectedColumnWidth,
        }),
      ]),
    );
    expect(calls.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Launch the virtual desktop',
          width: expectedColumnWidth,
        }),
      ]),
    );
    expect(calls.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Get help and guidance (opens in new window)',
          width: expectedColumnWidth,
        }),
      ]),
    );
  });

  it('passes correct props to ServiceCard for all cards and sets correct column width when an sde agreement', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (hasFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);
    (hasPermissions as jest.Mock).mockResolvedValue(true);
    (getCardColumnWidth as jest.Mock).mockReturnValue(
      'nhsuk-grid-column-one-half',
    );

    await render(
      await AgreementPage({ params: { agreement_id: sde_agreement_id } }),
    );

    const serviceCardCount = screen.getAllByTestId('service-card');
    expect(serviceCardCount.length).toBe(4);

    const expectedColumnWidth = 'nhsuk-grid-column-one-half';
    const calls = (ServiceCard as jest.Mock).mock.calls;

    expect(calls.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Manage users',
          width: expectedColumnWidth,
        }),
      ]),
    );
    expect(calls.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Launch the virtual desktop',
          width: expectedColumnWidth,
        }),
      ]),
    );
    expect(calls.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Upload reference data',
          width: expectedColumnWidth,
        }),
      ]),
    );
    expect(calls.flat()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Get help and guidance (opens in new window)',
          width: expectedColumnWidth,
        }),
      ]),
    );
  });

  it('does not include Upload reference data or Guidance when guidance_required is false for noByod agreement', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getUserAgreements as jest.Mock).mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: false,
      activeAgreements: [{ agreement_id: 'review_file' }],
    });

    render(await AgreementPage({ params: { agreement_id: 'review_file' } }));

    const calls = (ServiceCard as jest.Mock).mock.calls;

    expect(
      calls.some((call) => call.some((arg) => arg?.title === 'Manage users')),
    ).toBe(true);
    expect(
      calls.some((call) =>
        call.some((arg) => arg?.title === 'Launch the virtual desktop'),
      ),
    ).toBe(true);
    expect(
      calls.some((call) =>
        call.some((arg) => arg?.title === 'Upload reference data'),
      ),
    ).toBe(false);
    expect(
      calls.some((call) =>
        call.some(
          (arg) => arg?.title === 'Get help and guidance (opens in new window)',
        ),
      ),
    ).toBe(false);
  });

  it('does not include Upload reference data when agreement_id starts with cda-', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    const cda_agreeement_id = `cda-${agreement_id}`;
    (getUserAgreements as jest.Mock).mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: false,
      activeAgreements: [{ agreement_id: cda_agreeement_id }],
    });

    render(
      await AgreementPage({
        params: { agreement_id: cda_agreeement_id },
      }),
    );

    const calls = (ServiceCard as jest.Mock).mock.calls;

    expect(
      calls.some((call) => call.some((arg) => arg?.title === 'Manage users')),
    ).toBe(true);
    expect(
      calls.some((call) =>
        call.some((arg) => arg?.title === 'Launch the virtual desktop'),
      ),
    ).toBe(true);
    expect(
      calls.some((call) =>
        call.some((arg) => arg?.title === 'Upload reference data'),
      ),
    ).toBe(false);
    expect(
      calls.some((call) =>
        call.some(
          (arg) => arg?.title === 'Get help and guidance (opens in new window)',
        ),
      ),
    ).toBe(true);
  });

  it('fetches user agreements with empty string when no email in session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: {} });
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getUserAgreements as jest.Mock).mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: true,
      activeAgreements: [],
    });

    await render(
      await AgreementPage({ params: { agreement_id: agreement_id } }),
    );

    expect(getUserAgreements).toHaveBeenCalledWith('');
  });
});
