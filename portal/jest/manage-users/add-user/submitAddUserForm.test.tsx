import getUsersInAgreement from 'app/services/getUsersInAgreement';
import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AddUserSchema } from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserSchema';
import submitAddUserForm from '@/app/agreement/[agreement_id]/manage-users/add-user/_components/submitAddUserForm';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock(
  '@/app/agreement/[agreement_id]/manage-users/add-user/_components/addUserSchema',
  () => {
    return {
      __esModule: true,
      AddUserSchema: {
        safeParse: jest.fn(),
      },
    };
  },
);
jest.mock('app/services/getUsersInAgreement');
jest.mock('app/services/hasFeatureFlagEnabled');

const mockCookiesSet = jest.fn();
const mockCookies = cookies as jest.Mock;
const mockHasFeatureFlagEnabled = hasFeatureFlagEnabled as jest.Mock;
const mockGetUsersInAgreement = getUsersInAgreement as jest.Mock;
const mockAddUserSchema = AddUserSchema.safeParse as jest.Mock;

describe('submitAddUserForm tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.mockReturnValue({ set: mockCookiesSet });
  });

  it('throws an error if feature flag is disabled', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(false);

    await expect(
      submitAddUserForm('agreement1', 'form123', 'user456', {}, new FormData()),
    ).rejects.toThrow('This feature is disabled');
  });

  it('returns error if AddUserSchema check fails', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(true);
    mockAddUserSchema.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          fieldErrors: {
            email: ['Mocked error'],
            email_confirm: ['Mocked error'],
          },
          formErrors: [],
        }),
      },
    });

    const result = await submitAddUserForm(
      'agreement1',
      'form123',
      'user456',
      {},
      new FormData(),
    );
    console.log(result);
    expect(result).toEqual({
      errors: { email: ['Mocked error'], email_confirm: ['Mocked error'] },
    });
  });

  it('returns error if user email already exists', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(true);
    mockAddUserSchema.mockReturnValue({
      success: true,
      data: { email: 'existing@user.com' },
    });
    mockGetUsersInAgreement.mockResolvedValue({
      users: [{ email: 'existing@user.com' }],
    });

    const formData = new FormData();
    formData.set('first_name', 'Bob');
    formData.set('last_name', 'Dylan');
    formData.set('email', 'existing@user.com');
    formData.set('email_confirm', 'existing@user.com');
    formData.set('role', 'Analyst');

    const result = await submitAddUserForm(
      'agreement1',
      'form123',
      'user456',
      {},
      formData,
    );

    expect(result.errors).toEqual({
      email: ['This user already exists'],
      email_confirm: ['This user already exists'],
    });
  });

  it('sets cookie and redirects on success', async () => {
    mockHasFeatureFlagEnabled.mockResolvedValue(true);
    mockAddUserSchema.mockReturnValue({
      success: true,
      data: {
        first_name: 'Bob',
        last_name: 'Dylan',
        email: 'bob@test.com',
        email_confirm: 'bob@test.com',
        role: 'Analyst',
      },
    });
    mockGetUsersInAgreement.mockResolvedValue({ users: [] });

    const formData = new FormData();
    formData.set('first_name', 'Bob');
    formData.set('last_name', 'Dylan');
    formData.set('email', 'Bob@test.com');
    formData.set('email_confirm', 'Bob@test.com');
    formData.set('role', 'Analyst');

    await submitAddUserForm('agreement1', 'form123', 'user456', {}, formData);

    expect(mockCookiesSet).toHaveBeenCalledWith(
      'sde-add-user-form',
      JSON.stringify({
        first_name: 'Bob',
        last_name: 'Dylan',
        email: 'bob@test.com',
        role: 'Analyst',
        user_id: 'user456',
      }),
      { secure: true },
    );

    expect(redirect).toHaveBeenCalledWith(
      '/agreement/agreement1/manage-users/add-user/confirm?form_id=form123',
    );
  });

  it('sets fallback ERROR values when validated data fields are falsy', async () => {
    mockAddUserSchema.mockReturnValue({
      success: true,
      data: {
        first_name: '',
        last_name: '',
        email: '',
        email_confirm: '',
        role: '',
      },
      error: undefined,
    });

    mockHasFeatureFlagEnabled.mockResolvedValue(true);
    mockGetUsersInAgreement.mockResolvedValue({ users: [] });

    const formData = new FormData();

    await submitAddUserForm('agreement1', 'form123', 'user456', {}, formData);

    expect(mockCookiesSet).toHaveBeenCalledWith(
      'sde-add-user-form',
      JSON.stringify({
        first_name: 'ERROR',
        last_name: 'ERROR',
        email: 'ERROR',
        role: 'ERROR',
        user_id: 'user456',
      }),
      { secure: true },
    );
  });
});
