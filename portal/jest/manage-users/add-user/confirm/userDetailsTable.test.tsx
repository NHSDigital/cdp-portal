import { render, screen } from '@testing-library/react';
import React from 'react';

import UserDetailsTable from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/userDetailsTable';
import { getByDataCy } from '@/jest/utils';

const mockUsers = [
  {
    user_id: '1',
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice@test.com',
    role: 'Analyst',
    role_text: 'Data Analyst',
  },
  {
    user_id: '2',
    first_name: 'Bob',
    last_name: 'Brown',
    email: 'bob@test.com',
    role: 'Both',
    role_text: 'Both (Data Analyst and User Manager)',
  },
  {
    user_id: '3',
    first_name: 'Charlie',
    last_name: 'Davis',
    email: 'charlie@test.com',
    role: 'UserManager',
    role_text: 'User Manager',
  },
];

describe('UserDetailsTable tests', () => {
  it('renders table headers correctly', () => {
    render(
      <UserDetailsTable users={[]} agreement_id='abc123' form_id='form42' />,
    );

    expect(getByDataCy('first-name-header')).toHaveTextContent('First Name');
    expect(getByDataCy('last-name-header')).toHaveTextContent('Last Name');
    expect(getByDataCy('email-header')).toHaveTextContent('Email');
    expect(getByDataCy('role-header')).toHaveTextContent('Role');
    expect(getByDataCy('edit-header')).toHaveTextContent('Edit');
    expect(getByDataCy('delete-header')).toHaveTextContent('Delete');
  });

  it('renders user rows with correct data', () => {
    render(
      <UserDetailsTable
        users={mockUsers}
        agreement_id='xyz789'
        form_id='form77'
      />,
    );

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(mockUsers.length);

    rows.forEach((row, index) => {
      const user = mockUsers[index];

      expect(
        row.querySelector('[data-cy="first-name-cell"]'),
      ).toHaveTextContent(user.first_name);
      expect(row.querySelector('[data-cy="last-name-cell"]')).toHaveTextContent(
        user.last_name,
      );
      expect(row.querySelector('[data-cy="email-cell"]')).toHaveTextContent(
        user.email,
      );
      expect(row.querySelector('[data-cy="role-cell"]')).toHaveTextContent(
        user.role_text,
      );

      const editCell = row.querySelector('[data-cy="edit-cell"]');
      expect(editCell).toHaveTextContent('Edit');

      const hiddenEditText = row.querySelector('[data-cy="hidden-edit-text"]');
      expect(hiddenEditText).toHaveTextContent('Edit user details');
      expect(hiddenEditText).toHaveClass('nhsuk-u-visually-hidden');

      const editLink = row.querySelector('[data-cy="edit-cell"] a');
      expect(editLink).toHaveAttribute(
        'href',
        `/agreement/xyz789/manage-users/add-user?form_id=form77&user_id=${user.user_id}`,
      );

      const deleteCell = row.querySelector('[data-cy="delete-cell"]');
      expect(deleteCell).toHaveTextContent('Delete');

      const hiddenDeleteText = row.querySelector(
        '[data-cy="hidden-delete-text"]',
      );
      expect(hiddenDeleteText).toHaveTextContent('Delete user');
      expect(hiddenDeleteText).toHaveClass('nhsuk-u-visually-hidden');

      const deleteLink = row.querySelector('[data-cy="delete-cell"] a');
      expect(deleteLink).toHaveAttribute(
        'href',
        `/agreement/xyz789/manage-users/add-user/confirm/delete-user?form_id=form77&user_id=${user.user_id}`,
      );
    });
  });
});
