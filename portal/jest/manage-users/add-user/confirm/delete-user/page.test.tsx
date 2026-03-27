import { render, screen } from '@testing-library/react';
import React from 'react';

import DeleteUserPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/delete-user/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/delete-user/_components/deleteClient',
  () => ({
    __esModule: true,
    default: ({
      agreement_id,
      form_id,
      user_id,
    }: {
      agreement_id: string;
      form_id: string;
      user_id: string;
    }) => (
      <div data-testid='delete-client'>
        agreement_id: {agreement_id}, form_id: {form_id}, user_id: {user_id}
      </div>
    ),
  }),
);

describe('DeleteUserPage tests', () => {
  it('renders DeleteClient with correct props when valid searchParams are provided', () => {
    render(
      <DeleteUserPage
        params={{ agreement_id: '123' }}
        searchParams={{ form_id: '456', user_id: '789' }}
      />,
    );

    const deleteClient = screen.getByTestId('delete-client');
    expect(deleteClient).toHaveTextContent('agreement_id: 123');
    expect(deleteClient).toHaveTextContent('form_id: 456');
    expect(deleteClient).toHaveTextContent('user_id: 789');
  });

  it('throws error when form_id is missing', () => {
    const renderComponent = () =>
      render(
        <DeleteUserPage
          params={{ agreement_id: '123' }}
          searchParams={{ user_id: '789' }}
        />,
      );

    expect(renderComponent).toThrow('Form ID and user ID must be provided');
  });

  it('throws error when user_id is missing', () => {
    const renderComponent = () =>
      render(
        <DeleteUserPage
          params={{ agreement_id: '123' }}
          searchParams={{ form_id: '456' }}
        />,
      );

    expect(renderComponent).toThrow('Form ID and user ID must be provided');
  });

  it('throws error when form_id is an array', () => {
    const renderComponent = () =>
      render(
        <DeleteUserPage
          params={{ agreement_id: '123' }}
          searchParams={{ form_id: ['456'], user_id: '789' }}
        />,
      );

    expect(renderComponent).toThrow('Form ID and user ID must be provided');
  });

  it('throws error when user_id is an array', () => {
    const renderComponent = () =>
      render(
        <DeleteUserPage
          params={{ agreement_id: '123' }}
          searchParams={{ form_id: '456', user_id: ['789'] }}
        />,
      );

    expect(renderComponent).toThrow('Form ID and user ID must be provided');
  });

  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Confirm user details - Confirm delete user - ${whiteLabelValues.acronym}`,
    );
  });
});
