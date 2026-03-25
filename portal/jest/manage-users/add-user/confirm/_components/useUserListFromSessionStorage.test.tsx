import { renderHook } from '@testing-library/react';

import useUserListFromSessionStorage from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useUserListFromSessionStorage';
import { CookieNames } from '@/config/constants';
import { createMockUserToAdd } from '@/jest/testFactories';

const agreement_id = 'agreement1';
const form_id = 'form1';

const mockUserToAdd = createMockUserToAdd({
  first_name: 'Pink',
  last_name: 'Panther',
  email: 'pink.panther@test.com',
  role: 'Analyst',
});

beforeEach(() => {
  sessionStorage.clear();
});

describe('useUserListFromSessionStorage tests', () => {
  it('initializes with the latest user if session storage is empty', () => {
    const { result } = renderHook(() =>
      useUserListFromSessionStorage({
        latest_user_to_add: mockUserToAdd,
        agreement_id,
        form_id,
      }),
    );

    expect(result.current).toEqual([mockUserToAdd]);

    const sessionItem =
      sessionStorage.getItem(CookieNames.ADD_USER_FORM) ?? '{}';
    const parsed = JSON.parse(sessionItem);
    expect(parsed[agreement_id][form_id][mockUserToAdd.user_id]).toEqual(
      mockUserToAdd,
    );
  });

  it('appends new user to existing session storage', () => {
    const user1 = mockUserToAdd;
    const user2 = createMockUserToAdd({
      email: 'big.nose@test.com',
    });

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
    const user1 = createMockUserToAdd({
      email: 'pink.panther@test.com',
      first_name: 'Old',
    });
    const user2 = createMockUserToAdd({
      email: 'pink.panther@test.com',
      first_name: 'New',
    });

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

    expect(() => {
      renderHook(() =>
        useUserListFromSessionStorage({
          latest_user_to_add: mockUserToAdd,
          agreement_id,
          form_id,
        }),
      );
    }).toThrow();
  });
});
