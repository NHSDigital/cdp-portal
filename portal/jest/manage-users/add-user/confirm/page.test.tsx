import { render, screen } from '@testing-library/react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import { ConfirmClientProps } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/confirmClient';
import AddUserPage, {
  generateMetadata,
} from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/page';
import { getWhiteLabelValues } from '@/config/whiteLabel';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('Redirect called');
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/confirmClient',
  () => ({
    __esModule: true,
    default: ({
      latest_user_to_add,
      form_id,
      agreement_id,
    }: ConfirmClientProps) => (
      <div data-testid='confirm-client'>
        <span>{latest_user_to_add.first_name}</span>
        <span>{form_id}</span>
        <span>{agreement_id}</span>
      </div>
    ),
  }),
);

const mockCookies = cookies as jest.Mock;

describe('AddUserPage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects if add_user_form cookie is missing', async () => {
    mockCookies.mockReturnValue({
      get: () => undefined,
    });

    const params = { agreement_id: '123' };
    const searchParams = { form_id: 'abc' };

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );

    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  it('redirects if form_id is not a string', async () => {
    mockCookies.mockReturnValue({
      get: () => ({
        value: JSON.stringify({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@test.com',
          role: 'admin',
          user_id: 'user-1',
        }),
      }),
    });

    const params = { agreement_id: '123' };
    const searchParams = { form_id: ['abc'] };

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );

    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  test('renders ConfirmClient with correct props when cookie and form_id are valid', async () => {
    mockCookies.mockReturnValue({
      get: () => ({
        value: JSON.stringify({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@test.com',
          role: 'admin',
          user_id: 'user-1',
        }),
      }),
    });

    const params = { agreement_id: '123' };
    const searchParams = { form_id: 'abc' };

    const result = await AddUserPage({ params, searchParams });

    render(result as React.ReactElement);

    expect(screen.getByTestId('confirm-client')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('abc')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  test('redirects if cookie has malformed JSON', async () => {
    mockCookies.mockReturnValue({
      get: () => ({
        value: '{bad-json}',
      }),
    });

    const params = { agreement_id: '123' };
    const searchParams = { form_id: 'abc' };

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );
    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  test('redirects if cookie JSON is missing required fields', async () => {
    mockCookies.mockReturnValue({
      get: () => ({
        value: JSON.stringify({ first_name: 'OnlyFirstName' }),
      }),
    });

    const params = { agreement_id: '123' };
    const searchParams = { form_id: 'abc' };

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );
    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });

  test('redirects if cookie has invalid email format', async () => {
    mockCookies.mockReturnValue({
      get: () => ({
        value: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe',
          email: 'not-an-email',
          role: 'Analyst',
          user_id: 'u-123',
        }),
      }),
    });

    const params = { agreement_id: '123' };
    const searchParams = { form_id: 'abc' };

    await expect(AddUserPage({ params, searchParams })).rejects.toThrow(
      'Redirect called',
    );
    expect(redirect).toHaveBeenCalledWith(
      '/agreement/123/manage-users/add-user',
    );
  });
  it('exports correct metadata', async () => {
    const whiteLabelValues = getWhiteLabelValues();
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(
      `Confirm user details - ${whiteLabelValues.acronym}`,
    );
  });
});
