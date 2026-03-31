import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { UserToAdd } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/types';
import useSubmitUsers from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useSubmitUsers';
import { CookieNames } from '@/config/constants';
import { useAsyncError } from '@/helpers/errorHelpers';
import { createMockUserToAdd } from '@/jest/testFactories';

jest.mock('@/helpers/errorHelpers');

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/serverActions',
  () => ({
    createOneUserCommon: jest.fn(),
  }),
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const {
  createOneUserCommon,
} = require('@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/serverActions');

const mockUsersToAdd = [
  createMockUserToAdd({
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice@test.com',
    role: 'Analyst',
  }),
  createMockUserToAdd({
    first_name: 'Bob',
    last_name: 'Brown',
    email: 'bob@test.com',
    role: 'UserManager',
  }),
];

function TestComponent({ users = mockUsersToAdd }: { users?: UserToAdd[] }) {
  const { isSubmitting, submitUsers, progress, error } = useSubmitUsers({
    users_to_display: users,
    agreement_id: 'a123',
  });

  return (
    <form onSubmit={submitUsers} data-testid='form'>
      <label>
        Confirm
        <input type='checkbox' name='final_confirm' />
      </label>
      <button type='submit'>Submit</button>
      <div data-testid='submitting'>{isSubmitting ? 'yes' : 'no'}</div>
      <div data-testid='progress'>
        {progress ? `${progress.completed}/${progress.overall}` : 'none'}
      </div>
      <div data-testid='error'>{error}</div>
    </form>
  );
}

describe('useSubmitUsers tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    document.cookie = '';
  });

  it('shows error if final_confirm is not checked', async () => {
    render(<TestComponent />);
    fireEvent.submit(screen.getByTestId('form'));
    expect(await screen.findByTestId('error')).toHaveTextContent(
      'You must confirm that these details are correct',
    );
    expect(createOneUserCommon).not.toHaveBeenCalled();
  });

  it('submits users and updates progress', async () => {
    createOneUserCommon.mockResolvedValue(undefined);
    render(<TestComponent />);

    fireEvent.click(screen.getByRole('checkbox', { name: /confirm/i }));
    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(createOneUserCommon).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('submitting')).toHaveTextContent('yes');
      expect(screen.getByTestId('progress')).toHaveTextContent('2/2');
    });
  });

  it('handles errors with throwAsyncError', async () => {
    const throwAsyncErrorMock = jest.fn();
    (useAsyncError as jest.Mock).mockReturnValue(throwAsyncErrorMock);

    createOneUserCommon.mockRejectedValue(new Error('Something went wrong'));
    render(<TestComponent />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(throwAsyncErrorMock).toHaveBeenCalledWith(
        'Failed submitting users',
      );
    });
  });

  it('sets and removes cookies correctly', async () => {
    createOneUserCommon.mockResolvedValue(undefined);
    render(<TestComponent />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(document.cookie).toContain(
        CookieNames.MANAGE_USERS_SUCCESS_MESSAGE,
      );
      expect(document.cookie).not.toContain('add_user_form=');
    });
  });

  it('sets correct success message when one user is submitted', async () => {
    const singleUser = [createMockUserToAdd()];

    createOneUserCommon.mockResolvedValue(undefined);
    render(<TestComponent users={singleUser} />);

    fireEvent.click(screen.getByLabelText(/confirm/i));
    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(document.cookie).toContain(
        encodeURIComponent('Test User added successfully'),
      );
    });
  });

  it('sets correct success message when more than one user is submitted', async () => {
    createOneUserCommon.mockResolvedValue(undefined);
    render(<TestComponent users={mockUsersToAdd} />);

    fireEvent.click(screen.getByLabelText(/confirm/i));
    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(document.cookie).toContain(
        encodeURIComponent('2 users added successfully'),
      );
    });
  });
});
