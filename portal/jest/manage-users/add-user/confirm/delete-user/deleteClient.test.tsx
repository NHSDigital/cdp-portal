import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import DeleteClient from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/delete-user/_components/deleteClient';

const mockDeleteUser = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/delete-user/_components/useUserToDeleteFromSessionStorage',
  () => ({
    __esModule: true,
    default: () => ({
      userToDelete: 'Test User',
      deleteUser: mockDeleteUser,
    }),
  }),
);

describe('DeleteClient', () => {
  const props = {
    agreement_id: '123',
    form_id: '456',
    user_id: '789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the user name in the heading', () => {
    render(<DeleteClient {...props} />);
    expect(
      screen.getByRole('heading', { name: /delete test user/i }),
    ).toBeInTheDocument();
  });

  it('shows error message when form is submitted without selecting an option', () => {
    render(<DeleteClient {...props} />);

    const button = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(button);

    const errorMessage = 'Please select an option';
    expect(screen.getAllByText(errorMessage).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(errorMessage, { selector: 'span' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(errorMessage, { selector: 'a' }),
    ).toBeInTheDocument();
  });

  it('calls deleteUser when "yes" is selected', () => {
    render(<DeleteClient {...props} />);

    const yesInput = screen.getByLabelText(/yes/i);
    fireEvent.click(yesInput);

    const button = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(button);

    expect(mockDeleteUser).toHaveBeenCalledWith('789');
  });

  it('calls router.push when "no" is selected', () => {
    render(<DeleteClient {...props} />);

    const noInput = screen.getByLabelText(/no/i);
    fireEvent.click(noInput);

    const button = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith(
      `/agreement/123/manage-users/add-user/confirm?form_id=456`,
    );
  });
});
