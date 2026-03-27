import { act, renderHook } from '@testing-library/react';

import useUserToDeleteFromSessionStorage from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/delete-user/_components/useUserToDeleteFromSessionStorage';
import { redirect_and_force_reload } from '@/app/shared/common';
import { CookieNames } from '@/config/constants';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/app/shared/common', () => ({
  redirect_and_force_reload: jest.fn(),
}));

const agreement_id = 'agreement1';
const form_id = 'form1';

const mockUser = {
  user_id: 'user_1',
  first_name: 'Pink',
  last_name: 'Panther',
  email: 'pink.panther@test.com',
  role: 'Analyst',
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('useUserToDeleteFromSessionStorage tests', () => {
  it('sets userToDelete correctly from sessionStorage', () => {
    sessionStorage.setItem(
      CookieNames.ADD_USER_FORM,
      JSON.stringify({
        [agreement_id]: {
          [form_id]: {
            [mockUser.user_id]: mockUser,
          },
        },
      }),
    );

    const { result } = renderHook(() =>
      useUserToDeleteFromSessionStorage({
        agreement_id,
        form_id,
        user_id: mockUser.user_id,
      }),
    );

    expect(result.current.userToDelete).toBe('Pink Panther');
  });

  it('throws error if user not found in sessionStorage', () => {
    sessionStorage.setItem(CookieNames.ADD_USER_FORM, JSON.stringify({}));

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn());

    expect(() =>
      renderHook(() =>
        useUserToDeleteFromSessionStorage({
          agreement_id,
          form_id,
          user_id: mockUser.user_id,
        }),
      ),
    ).toThrow('No users to delete.');
    consoleSpy.mockRestore();
  });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());

  expect(() =>
    renderHook(() =>
      useUserToDeleteFromSessionStorage({
        agreement_id,
        form_id,
        user_id: mockUser.user_id,
      }),
    ),
  ).toThrow('No users to delete.');
  consoleSpy.mockRestore();

  it('throws error on second deleteUser call when no users remain in sessionStorage', () => {
    sessionStorage.setItem(
      CookieNames.ADD_USER_FORM,
      JSON.stringify({
        [agreement_id]: {
          [form_id]: {
            [mockUser.user_id]: mockUser,
          },
        },
      }),
    );

    const { result } = renderHook(() =>
      useUserToDeleteFromSessionStorage({
        agreement_id,
        form_id,
        user_id: mockUser.user_id,
      }),
    );

    act(() => {
      result.current.deleteUser(mockUser.user_id);
    });

    expect(() => {
      act(() => {
        result.current.deleteUser(mockUser.user_id);
      });
    }).toThrow('No users to delete.');
  });

  it('deletes user and redirects if no users remain', () => {
    sessionStorage.setItem(
      CookieNames.ADD_USER_FORM,
      JSON.stringify({
        [agreement_id]: {
          [form_id]: {
            [mockUser.user_id]: mockUser,
          },
        },
      }),
    );
    const { result } = renderHook(() =>
      useUserToDeleteFromSessionStorage({
        agreement_id,
        form_id,
        user_id: mockUser.user_id,
      }),
    );

    act(() => {
      result.current.deleteUser(mockUser.user_id);
    });

    expect(sessionStorage.getItem(CookieNames.ADD_USER_FORM)).toBeNull();
    expect(document.cookie.includes('add_user_form=')).toBe(false);
    expect(mockPush).toHaveBeenCalledWith(
      `/agreement/${agreement_id}/manage-users`,
    );
  });

  it('deletes user but retains others and redirects with updated session/cookie', () => {
    const anotherUser = {
      user_id: 'user_2',
      first_name: 'Big',
      last_name: 'Nose',
      email: 'big.nose@test.com',
      role: 'DataManager',
    };

    sessionStorage.setItem(
      CookieNames.ADD_USER_FORM,
      JSON.stringify({
        [agreement_id]: {
          [form_id]: {
            [mockUser.user_id]: mockUser,
            user2: anotherUser,
          },
        },
      }),
    );

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    const { result } = renderHook(() =>
      useUserToDeleteFromSessionStorage({
        agreement_id,
        form_id,
        user_id: mockUser.user_id,
      }),
    );

    act(() => {
      result.current.deleteUser(mockUser.user_id);
    });

    const expectedCookie = `add_user_form=${encodeURIComponent(JSON.stringify(anotherUser))}`;
    expect(document.cookie).toContain(expectedCookie);

    expect(redirect_and_force_reload).toHaveBeenCalledWith(
      `/agreement/${agreement_id}/manage-users/add-user/confirm?form_id=${form_id}`,
    );
  });
});
