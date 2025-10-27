import { render, screen } from '@testing-library/react';
import React from 'react';

import ChangeUserRoleForm from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/changeUserRoleForm';
import changeUserRole from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/serverActions';
import ChangeRolePage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/changeUserRoleForm',
);
jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/user/[user]/change-role/_components/serverActions',
);

describe('ChangeRolePage tests', () => {
  const agreement_id = '123';
  const user = encodeURIComponent('alice@test.com');

  it('renders ChangeUserRoleForm with correct props', async () => {
    (changeUserRole as jest.Mock).mockImplementation(() => Promise.resolve());
    (ChangeUserRoleForm as jest.Mock).mockImplementation(
      ({ changeUserRole }) => (
        <form data-testid='mock-form' onSubmit={changeUserRole}>
          <button type='submit'>Submit</button>
        </form>
      ),
    );
    const result = await ChangeRolePage({ params: { agreement_id, user } });

    render(result);

    expect(screen.getByTestId('mock-form')).toBeInTheDocument();

    expect(ChangeUserRoleForm).toHaveBeenCalledWith(
      expect.objectContaining({
        changeUserRole: expect.any(Function),
      }),
      {},
    );
  });
  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Change user role - ${whiteLabelValues.acronym}`,
    );
  });
});
