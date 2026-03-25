import { render, screen } from '@testing-library/react';
import * as React from 'react';

import AcceptAndConfirmForm from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/acceptAndConfirmForm';
import AddAnotherUserLink from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/addAnotherUserLink';
import ConfirmClient, {
  ConfirmClientProps,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/confirmClient';
import UserDetailsTable from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/userDetailsTable';
import useSubmitUsers from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useSubmitUsers';
import useUserListFromSessionStorage from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useUserListFromSessionStorage';
import { WhiteLabelEntry } from '@/config/whiteLabel';
import { createMockUserToAdd } from '@/jest/testFactories';
import { getByDataCy } from '@/jest/utils';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: jest.fn(),
  };
});
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useSubmitUsers',
  () => {
    const useSubmitUsers = jest.fn(() => ({
      isSubmitting: false,
      submitUsers: jest.fn(),
      progress: null,
      error: null,
    }));
    return useSubmitUsers;
  },
);
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useUserListFromSessionStorage',
  () => jest.fn(() => []),
);
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/loadingView',
  () => {
    const LoadingView = jest.fn(() => <div data-testid='loading-view' />);
    return LoadingView;
  },
);
jest.mock('@/app/shared/backLink', () => {
  return jest.fn(() => <div data-testid='back-link' />);
});

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/acceptAndConfirmForm',
  () => {
    const AcceptAndConfirmForm = jest.fn(() => (
      <div data-testid='accept-and-confirm-form' />
    ));
    return AcceptAndConfirmForm;
  },
);
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/userDetailsTable',
  () => {
    const UserDetailsTable = jest.fn(() => (
      <div data-testid='user-details-table' />
    ));
    return UserDetailsTable;
  },
);
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/addAnotherUserLink',
  () => {
    const AddAnotherUserLink = jest.fn(() => (
      <div data-testid='add-another-user-link' />
    ));
    return AddAnotherUserLink;
  },
);

describe('confirmClient tests', () => {
  const mockUseActionState = React.useActionState as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseActionState.mockReturnValue([{}, jest.fn(), false]);
  });

  const baseUser = createMockUserToAdd();

  const mockWhiteLabelValues: WhiteLabelEntry = {
    acronym: 'SDE',
    longName: 'Secure Data Environment',
  };

  const baseProps: ConfirmClientProps = {
    latest_user_to_add: baseUser,
    form_id: '123',
    agreement_id: 'agreement_1',
    createOneUserNoJS: jest.fn(),
    whiteLabelValues: mockWhiteLabelValues,
  };

  const mockUseUserListFromSessionStorage =
    useUserListFromSessionStorage as jest.Mock;
  const mockUseSubmitUsers = useSubmitUsers as jest.Mock;

  window.scrollTo = jest.fn();

  it('calls window.scrollTo on mount', () => {
    mockUseUserListFromSessionStorage.mockReturnValue([
      baseProps.latest_user_to_add,
    ]);

    render(<ConfirmClient {...baseProps} />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('renders LoadingView when submitting and progress exists', () => {
    mockUseUserListFromSessionStorage.mockReturnValue([
      baseProps.latest_user_to_add,
    ]);
    mockUseSubmitUsers.mockReturnValue({
      isSubmitting: true,
      submitUsers: jest.fn(),
      progress: 50,
      error: null,
    });

    render(<ConfirmClient {...baseProps} />);

    expect(screen.getByTestId('loading-view')).toBeInTheDocument();
    expect(screen.queryByText('Confirm user details')).not.toBeInTheDocument();
  });

  it('renders confirm view with correct content', () => {
    mockUseUserListFromSessionStorage.mockReturnValue([
      baseProps.latest_user_to_add,
    ]);
    mockUseSubmitUsers.mockReturnValue({
      isSubmitting: false,
      submitUsers: jest.fn(),
      progress: null,
      error: null,
    });

    render(<ConfirmClient {...baseProps} />);

    expect(screen.getByTestId('back-link')).toBeInTheDocument();
    expect(screen.getByTestId('user-details-table')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Confirm user details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'New Data Analysts will be sent an email to an online induction and assessment. Once they have passed this induction, these users will be activated and charged for.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('add-another-user-link')).toBeInTheDocument();

    expect(getByDataCy('data-analyst-warning')).toBeInTheDocument();

    const para = screen.getByText(/Data Analysts are charged/i).closest('p');
    expect(para).toHaveTextContent('Data Analysts are charged');
    expect(para).toHaveTextContent('£435 a month');
    expect(para).toHaveTextContent(
      'per agreement, not including optional tools such as Stata.',
    );
    const strongText = screen.getByText('£435 a month', {
      selector: 'strong',
    });
    expect(strongText).toBeInTheDocument();
    const para2 = screen.getByText(/This price will increase to/i).closest('p');
    expect(para2).toHaveTextContent('This price will increase to');
    expect(para2).toHaveTextContent('£472 a month');
    expect(para2).toHaveTextContent('per agreement from ');
    expect(para2).toHaveTextContent('1 April 2026.');
    expect(strongText).toBeInTheDocument();
    expect(
      screen.getByText(
        'Data Analysts will be charged in the first month regardless of when they are activated.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'New User Managers will be sent an email to set up their account.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('User Manager accounts are not charged for.'),
    ).toBeInTheDocument();
    const para3 = screen.getByText(/For more information, visit/i).closest('p');
    expect(para3).toHaveTextContent('For more information, visit');
    expect(para3).toHaveTextContent(
      'charges to access the SDE (opens in a new window).',
    );
    const link = screen.getByRole('link', {
      name: /charges to access the SDE \(opens in a new window\)/i,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://digital.nhs.uk/services/secure-data-environment-service#charges-to-access-the-sde',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.queryByTestId('accept-and-confirm-form')).toBeInTheDocument();

    expect(UserDetailsTable).toHaveBeenCalledWith(
      {
        agreement_id: baseProps.agreement_id,
        form_id: baseProps.form_id,
        users: [baseProps.latest_user_to_add],
      },
      expect.anything(),
    );

    expect(AddAnotherUserLink).toHaveBeenCalledWith(
      {
        form_id: baseProps.form_id,
        agreement_id: baseProps.agreement_id,
      },
      expect.anything(),
    );
    expect(AcceptAndConfirmForm).toHaveBeenCalledWith(
      {
        cookieAddedUser: baseProps.latest_user_to_add,
        submitUsers: expect.any(Function),
        createOneUserNoJSFormAction: expect.any(Function),
        error: expect.anything(),
        whiteLabelKey: mockWhiteLabelValues.acronym,
      },
      expect.anything(),
    );
  });
});
