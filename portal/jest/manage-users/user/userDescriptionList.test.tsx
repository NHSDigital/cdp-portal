import { render, screen } from '@testing-library/react';
import { NO_TIMESTAMP_TEXT } from 'app/shared/common';
import { AnchorHTMLAttributes } from 'react';

import UserDescriptionList, {
  UserDescriptionListProps,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/_components/UserDescriptionList';
import { WhiteLabelKey } from '@/config/whiteLabel';
import { createMockUser } from '@/jest/testFactories';
import { getByDataCy, queryByDataCy } from '@/jest/utils';

jest.mock('@/app/_components/status-tags/StatusTags', () => ({
  StatusTag: ({ status }) => <span data-testid='status-tag'>{status}</span>,
  WhatDoTheseStatusesMean: () => <div data-testid='status-info' />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{props.children}</a>
  ),
}));

jest.mock('app/shared/common', () => {
  const originalModule = jest.requireActual('app/shared/common');

  return {
    ...originalModule,
    getFormattedRole: jest.fn((roles) => roles?.join(', ') || ''),
    getFormattedFleetType: jest.fn((fleet) => fleet),
    getFormattedTimestamp: jest.fn((ts) =>
      originalModule.getFormattedTimestamp(ts),
    ),
  };
});

const props: UserDescriptionListProps = {
  agreement_id: '123',
  user_details: createMockUser({
    email: 'test@test.com',
    application_roles_agreement: ['Admin'],
  }),
  whiteLabelKey: 'SDE',
};

describe('UserDescriptionList unit tests', () => {
  it('renders the basic details', async () => {
    const result = UserDescriptionList({ ...props });

    render(result);

    expect(getByDataCy('status')).toHaveTextContent('Activated');
    expect(getByDataCy('email')).toHaveTextContent('test@test.com');
    expect(getByDataCy('role')).toHaveTextContent('Admin');
    expect(getByDataCy('added_to_dsa')).toHaveTextContent('1 January 2024');
    expect(getByDataCy('reactivated')).toHaveTextContent('1 May 2024');
  });

  it('shows VDI memory and induction if Analyst with passed induction', async () => {
    const analystUser = createMockUser({
      application_roles_agreement: ['Analyst'],
      induction: {
        passed: true,
        passed_timestamp: '2024-02-02',
      },
      fleet_type: 'fleeting',
    });
    const result = UserDescriptionList({
      ...props,
      user_details: analystUser,
    });

    render(result);

    expect(getByDataCy('vdi_memory_size')).toHaveTextContent('fleeting');
    expect(getByDataCy('induction_assessment_passed')).toHaveTextContent(
      '2 February 2024',
    );
    expect(getByDataCy('last_logged_in')).toBeInTheDocument();
  });

  it('renders deactivated timestamp if status is Deactivated', async () => {
    const deactivatedUser = createMockUser({
      calculated_status: 'Deactivated',
      disabled_timestamp_agreement: '2024-06-30',
    });
    const result = UserDescriptionList({
      ...props,
      user_details: deactivatedUser,
    });

    render(result);

    expect(getByDataCy('deactivated')).toHaveTextContent('30 June 2024');
  });

  it('renders fallback timestamp when none provided', async () => {
    const noTimestampsUser = createMockUser({
      creation_timestamp_agreement: undefined,
      creation_timestamp_global: undefined,
    });
    const result = await UserDescriptionList({
      ...props,
      user_details: noTimestampsUser,
    });
    render(result);

    expect(getByDataCy('added_to_dsa')).toHaveTextContent(NO_TIMESTAMP_TEXT);
  });

  it('handles when last login is not present', async () => {
    const expected_text = 'Never logged in';
    const missingLastLoginUser = createMockUser({
      last_login: undefined,
    });
    const result = UserDescriptionList({
      ...props,
      user_details: missingLastLoginUser,
    });

    render(result);

    const container = screen.getAllByText(expected_text);
    expect(container).toHaveLength(2);
    const hiddenElements = screen
      .getAllByText(expected_text)
      .filter((el) => el.classList.contains('nhsuk-u-visually-hidden'));
    expect(hiddenElements).toHaveLength(1);
  });

  it('renders change role link only if user agreement is enabled', async () => {
    const inactiveUser = createMockUser({
      enabled_agreement: false,
    });
    const inactive_user_result = UserDescriptionList({
      ...props,
      user_details: inactiveUser,
    });

    render(inactive_user_result);
    expect(queryByDataCy?.('change-role-link')).not.toBeInTheDocument();

    const active_user_result = UserDescriptionList({ ...props });

    render(active_user_result);
    expect(queryByDataCy?.('change-role-link')).toBeInTheDocument();
    expect(getByDataCy('change-role-link')).toHaveAttribute(
      'href',
      '/agreement/123/manage-users/user/test@test.com/change-role',
    );
  });

  it('does not show induction assessment passed if analyst but induction not passed', async () => {
    const analystNoPass = createMockUser({
      application_roles_agreement: ['Analyst'],
      induction: { passed: false },
    });
    const result = UserDescriptionList({
      ...props,
      user_details: analystNoPass,
    });
    render(result);

    expect(
      queryByDataCy('induction_assessment_passed'),
    ).not.toBeInTheDocument();
  });

  it('does not show Last logged in if not Analyst', async () => {
    const nonAnalyst = createMockUser({
      application_roles_agreement: ['Admin'],
    });
    const result = UserDescriptionList({
      ...props,
      user_details: nonAnalyst,
    });
    render(result);

    expect(queryByDataCy('last_logged_in')).not.toBeInTheDocument();
  });

  it('does not show Reactivated if status is not Activated', async () => {
    const notActivatedUser = createMockUser({
      calculated_status: 'Pending Induction',
      reactivated_timestamp_agreement: '2024-05-01',
    });
    const result = UserDescriptionList({
      ...props,
      user_details: notActivatedUser,
    });
    render(result);

    expect(queryByDataCy('reactivated')).not.toBeInTheDocument();
  });

  it('does not show induction_assessment_passed if whiteLabelKey is CDP', async () => {
    const inductionPassedUser = createMockUser({
      induction: {
        passed: true,
        passed_timestamp: '2024-02-02',
      },
    });
    const result = UserDescriptionList({
      ...props,
      user_details: inductionPassedUser,
      whiteLabelKey: 'CDP',
    });
    render(result);

    expect(
      queryByDataCy('induction_assessment_passed'),
    ).not.toBeInTheDocument();
  });

  it('induction_assessment_passed throws error if whiteLabelKey is not recognised', async () => {
    const fakeKey = 'FAKE' as unknown as WhiteLabelKey;
    const inductionPassedUser = createMockUser({
      induction: { passed: true, passed_timestamp: '2024-02-02' },
    });

    expect(() =>
      UserDescriptionList({
        ...props,
        user_details: inductionPassedUser,
        whiteLabelKey: fakeKey,
      }),
    ).toThrow('show induction assessment passed entry missing: FAKE');
  });
});
