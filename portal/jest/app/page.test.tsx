import { fireEvent, render, screen } from '@testing-library/react';
import { redirect, useRouter } from 'next/navigation';

import SelectAgreementPage, { generateMetadata } from '@/app/page';
import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import { getLoggerAndSession } from '@/app/shared/logging';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import { checkAccessibility } from '@/jest/utils';
import getUserAgreements from '@/services/getUserAgreements';

jest.mock('@/app/shared/inductionHelpers');
jest.mock('@/app/shared/logging');
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({})),
}));
jest.mock('app/services/hasFeatureFlagEnabled');
jest.mock('@/services/getUserAgreements');
jest.mock('@/config/whiteLabel', () => ({
  getWhiteLabelValues: jest.fn(),
}));

const getUserAgreeentsBody = {
  selectedAgreement: null,
  activeAgreements: [
    { agreement_id: '123', meaningful_name: 'Agreement 123' },
    { agreement_id: '456', meaningful_name: 'Agreement 456' },
  ],
  inductionPassed: false,
  inductionNeeded: true,
};

const mockLogger = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  error: jest.fn(),
};

describe('SelectAgreementPage tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (hasFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);
    (getInductionRedirectTarget as jest.Mock).mockReturnValue(null);
    (getUserAgreements as jest.Mock).mockResolvedValue(getUserAgreeentsBody);
    (getLoggerAndSession as jest.Mock).mockResolvedValue({
      logger: mockLogger,
      session: { user: { email: 'admin@test.com' } },
    });
    (getWhiteLabelValues as jest.Mock).mockReturnValue({
      longName: 'Secure Data Environment',
      acronym: 'SDE',
    });
  });

  it('renders page content if all checks pass', async () => {
    const { container } = render(await SelectAgreementPage());

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();

    expect(
      screen.getByRole('heading', {
        name: /Access an agreement/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Search agreements by name or number'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/ })).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', {
        name: /Search agreements by name or number/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('More information on this step'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you are a User Manager select an agreement to manage users',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you are a Data Analyst select an agreement to access your data via the SDE platform.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('If you have both roles you will be able to do both.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /You aren't a member of any agreements in our database. If this is in error please contact us/,
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Agreement 123')).toBeInTheDocument();
    expect(screen.getByText('Agreement 456')).toBeInTheDocument();

    await checkAccessibility(container);
  });

  it('User is redirected to induction page if getInductionRedirectTarget returns /induction', async () => {
    (getInductionRedirectTarget as jest.Mock).mockReturnValue('/induction');

    render(await SelectAgreementPage());

    expect(getInductionRedirectTarget).toHaveBeenCalledWith({
      inductionFeatureFlagEnabled: true,
      inductionNeeded: true,
      inductionPassed: false,
    });
    expect(redirect).toHaveBeenCalledWith('/induction');
  });

  it('redirects to agreement page if only one agreement available', async () => {
    const oneAgreement = {
      ...getUserAgreeentsBody,
      activeAgreements: [
        { agreement_id: '123', meaningful_name: 'Agreement 123' },
      ],
    };
    (getUserAgreements as jest.Mock).mockResolvedValue(oneAgreement);

    render(await SelectAgreementPage());

    expect(getInductionRedirectTarget).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/agreement/123');
  });

  it('displays message if user has no agreements', async () => {
    const noAgreements = {
      ...getUserAgreeentsBody,
      activeAgreements: [],
    };
    (getUserAgreements as jest.Mock).mockResolvedValue(noAgreements);

    render(await SelectAgreementPage());

    expect(
      screen.getByText(
        /You aren't a member of any agreements in our database. If this is in error please contact us/,
      ),
    ).toBeInTheDocument();
  });

  it('redirects correctly when agreement is selected', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    render(await SelectAgreementPage());

    const agreement = screen.getByRole('link', { name: /agreement 123/i });
    fireEvent.click(agreement);

    expect(mockPush).toHaveBeenCalledWith('/agreement/123/');
  });

  it('handles agreement with no meaningful name', async () => {
    const agreement = {
      ...getUserAgreeentsBody,
      activeAgreements: [
        { agreement_id: 'Caramel Apple', meaningful_name: undefined },
        { agreement_id: '456', meaningful_name: 'Pumpkin Pie' },
        { agreement_id: 'Haunted Marshmallow', meaningful_name: null },
        { agreement_id: 'Chocolate Eyeballs' },
      ],
    };
    (getUserAgreements as jest.Mock).mockResolvedValue(agreement);

    render(await SelectAgreementPage());

    expect(screen.getByText('CARAMEL APPLE')).toBeInTheDocument();
    expect(screen.getByText('Pumpkin Pie')).toBeInTheDocument();
    expect(screen.getByText('HAUNTED MARSHMALLOW')).toBeInTheDocument();
    expect(screen.getByText('Chocolate Eyeballs')).toBeInTheDocument();
  });

  it('exports correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe('Select agreement - SDE');
  });
});
