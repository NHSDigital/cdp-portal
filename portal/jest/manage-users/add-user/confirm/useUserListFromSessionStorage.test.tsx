import { renderHook } from '@testing-library/react';

import { UserToAdd } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/types';
import useUserListFromSessionStorage from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useUserListFromSessionStorage';
import { CookieNames } from '@/config/constants';

const agreement_id = 'agreement1';
const form_id = 'form1';

const mockUser: UserToAdd = {
  user_id: 'user_1',
  first_name: 'Pink',
  last_name: 'Panther',
  email: 'pink.panther@test.com',
  role: 'Analyst',
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('useUserListFromSessionStorage tests', () => {
  it('initializes with the latest user if session storage is empty', () => {
    const user = mockUser;
    const { result } = renderHook(() =>
      useUserListFromSessionStorage({
        latest_user_to_add: user,
        agreement_id,
        form_id,
      }),
    );

    expect(result.current).toEqual([user]);

    const sessionItem =
      sessionStorage.getItem(CookieNames.ADD_USER_FORM) ?? '{}';
    const parsed = JSON.parse(sessionItem);
    expect(parsed[agreement_id][form_id][user.user_id]).toEqual(user);
  });

  it('appends new user to existing session storage', () => {
    const user1 = mockUser;
    const user2 = {
      ...mockUser,
      user_id: 'user_2',
      email: 'big.nose@test.com',
    };

    const initialData = {
      [agreement_id]: {
        [form_id]: {
          [user1.user_id]: user1,
        },
      },
    };
    sessionStorage.setItem(
      CookieNames.ADD_USER_FORM,
      JSON.stringify(initialData),
    );

    const { result } = renderHook(() =>
      useUserListFromSessionStorage({
        latest_user_to_add: user2,
        agreement_id,
        form_id,
      }),
    );

    expect(result.current).toEqual([user1, user2]);

    const sessionItem =
      sessionStorage.getItem(CookieNames.ADD_USER_FORM) ?? '{}';
    const parsed = JSON.parse(sessionItem);
    expect(Object.keys(parsed[agreement_id][form_id])).toHaveLength(2);
  });

  it('updates existing user if email matches (deduplicates)', () => {
    const user1 = {
      ...mockUser,
      email: 'pink.panther@test.com',
      first_name: 'Old',
    };
    const user2 = {
      ...mockUser,
      user_id: 'user_2',
      email: 'pink.panther@test.com',
      first_name: 'New',
    };

    const existingData = {
      [agreement_id]: {
        [form_id]: {
          [user1.user_id]: user1,
        },
      },
    };
    sessionStorage.setItem(
      CookieNames.ADD_USER_FORM,
      JSON.stringify(existingData),
    );

    const { result } = renderHook(() =>
      useUserListFromSessionStorage({
        latest_user_to_add: user2,
        agreement_id,
        form_id,
      }),
    );

    expect(result.current).toEqual([user2]);

    const sessionItem =
      sessionStorage.getItem(CookieNames.ADD_USER_FORM) ?? '{}';
    const parsed = JSON.parse(sessionItem);
    expect(parsed[agreement_id][form_id][user2.user_id].first_name).toBe('New');
    expect(parsed[agreement_id][form_id][user1.user_id]).toBeUndefined();
  });

  it('handles empty or invalid sessionStorage gracefully', () => {
    sessionStorage.setItem(CookieNames.ADD_USER_FORM, 'invalid_json');

    const user = mockUser;
    expect(() => {
      renderHook(() =>
        useUserListFromSessionStorage({
          latest_user_to_add: user,
          agreement_id,
          form_id,
        }),
      );
    }).toThrow();
  });
});
