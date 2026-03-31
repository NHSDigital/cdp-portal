import { render, screen, within } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import AgreementPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/page';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import getUserAgreements from '@/services/getUserAgreements';

import { getWhiteLabelValues } from '../../config/whiteLabel';
import { getByDataCy } from '../utils';

jest.mock('@/config/whiteLabel');
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
jest.mock('@/services/getUserAgreements');
jest.mock('@/app/services/hasPermissions', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(true)),
}));

const agreement_id = 'test-agreement';

const getUserAgreeentsBody = {
  selectedAgreement: null,
  activeAgreements: [{ agreement_id: '123', meaningful_name: 'Pumpkin Pie' }],
  inductionPassed: false,
  inductionNeeded: false,
};

describe('AgreementPage integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserAgreements as jest.Mock).mockResolvedValue(getUserAgreeentsBody);
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      acronym: 'SDE',
      longName: 'Secure Data Environment',
    });
  });

  it('redirects when getInductionRedirectTarget returns a path', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue('/induction');

    render(await AgreementPage({ params: Promise.resolve({ agreement_id }) }));

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/induction');
  });

  it('does not redirect when getInductionRedirectTarget returns null', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);

    render(await AgreementPage({ params: Promise.resolve({ agreement_id }) }));
    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders page content for cda agreement correctly', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    const cda_agreement = 'cda-yayayay';
    (getUserAgreements as jest.Mock).mockResolvedValue({
      ...getUserAgreeentsBody,
      activeAgreements: [
        { agreement_id: cda_agreement, meaningful_name: 'CDA Agreement' },
        { agreement_id: agreement_id, meaningful_name: 'Test Agreement' },
      ],
    });

    render(
      await AgreementPage({
        params: Promise.resolve({ agreement_id: cda_agreement }),
      }),
    );

    expect(getByDataCy('go-back-link')).toBeInTheDocument();
    expect(
      screen.getByText('Secure Data Environment (SDE) Portal'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Access your online services for ${cda_agreement}`),
    ).toBeInTheDocument();

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    cards.forEach((card) => {
      expect(card).toHaveClass('nhsuk-grid-column-one-third');
    });

    const manageUsersCard = getByDataCy('manage-users-card');
    expect(manageUsersCard).toBeInTheDocument();
    expect(manageUsersCard).toHaveTextContent('Manage users');
    expect(manageUsersCard).toHaveTextContent(
      'View, manage and add user accounts',
    );
    const manageUsersLink = within(manageUsersCard).getByRole('link', {
      name: 'Manage users',
    });
    expect(manageUsersLink).toHaveAttribute(
      'href',
      `./${cda_agreement}/manage-users`,
    );

    const launchVdiCard = getByDataCy('launch-virtual-desktop-card');
    expect(launchVdiCard).toBeInTheDocument();
    expect(launchVdiCard).toHaveTextContent('Launch the virtual desktop');
    expect(launchVdiCard).toHaveTextContent(
      'Access the data, tools and service in your agreement',
    );
    const vdiLink = within(launchVdiCard).getByRole('link', {
      name: 'Launch the virtual desktop',
    });
    expect(vdiLink).toHaveAttribute(
      'href',
      `./${cda_agreement}/switchagreement`,
    );

    const guidanceCard = getByDataCy('help-card');
    expect(guidanceCard).toBeInTheDocument();
    expect(guidanceCard).toHaveTextContent(
      'Get help and guidance (opens in new window)',
    );
    expect(guidanceCard).toHaveTextContent(
      'Access guidance on setting up your account and getting started with the tools',
    );
    const guidanceLink = within(guidanceCard).getByRole('link', {
      name: 'Get help and guidance (opens in new window)',
    });
    expect(guidanceLink).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides',
    );
  });

  it('renders page content for sde agreement correctly', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    const sde_agreement = 'dsa-heyheyhey';
    (getUserAgreements as jest.Mock).mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: false,
      activeAgreements: [
        { agreement_id: sde_agreement, meaningful_name: 'SDE Agreement' },
      ],
    });

    render(
      await AgreementPage({
        params: Promise.resolve({ agreement_id: sde_agreement }),
      }),
    );

    expect(
      screen.getByText('Secure Data Environment (SDE) Portal'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Access your online services for ${sde_agreement}`),
    ).toBeInTheDocument();

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(4);
    cards.forEach((card) => {
      expect(card).toHaveClass('nhsuk-grid-column-one-half');
    });

    expect(screen.getByText('Manage users')).toBeInTheDocument();
    expect(screen.getByText('Launch the virtual desktop')).toBeInTheDocument();
    expect(
      screen.getByText('Get help and guidance (opens in new window)'),
    ).toBeInTheDocument();

    const uploadRefDataCard = getByDataCy('upload-ref-data-card');
    expect(uploadRefDataCard).toBeInTheDocument();
    expect(uploadRefDataCard).toHaveTextContent('Upload reference data');
    expect(uploadRefDataCard).toHaveTextContent(
      'Bring reference data into the environment',
    );
    const vdiLink = within(uploadRefDataCard).getByRole('link', {
      name: 'Upload reference data',
    });
    expect(vdiLink).toHaveAttribute('href', `./${sde_agreement}/fileupload`);
  });

  it('does not include Upload reference data or Guidance when guidance_required is false for noByod agreement', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getUserAgreements as jest.Mock).mockResolvedValue({
      ...getUserAgreeentsBody,
      activeAgreements: [{ agreement_id: 'review_file' }],
    });

    render(
      await AgreementPage({
        params: Promise.resolve({ agreement_id: 'review_file' }),
      }),
    );

    expect(screen.getByText('Manage users')).toBeInTheDocument();
    expect(screen.getByText('Launch the virtual desktop')).toBeInTheDocument();
    expect(screen.queryByText('Upload reference data')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Get help and guidance (opens in new window)'),
    ).not.toBeInTheDocument();
  });

  it('fetches user agreements with empty string when no email in session', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: {} });
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getUserAgreements as jest.Mock).mockResolvedValueOnce({
      inductionNeeded: false,
      inductionPassed: true,
      activeAgreements: [],
    });

    render(await AgreementPage({ params: Promise.resolve({ agreement_id }) }));

    expect(getUserAgreements).toHaveBeenCalledWith('');
  });

  it('returns correct metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'Portal - SDE',
    });
  });
});
