import { UserToAdd } from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/types';
import { User } from '@/app/services/getUsersInAgreement';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  calculated_status: 'Activated',
  application_roles_agreement: ['Analyst'],
  creation_timestamp_agreement: '2024-01-01',
  creation_timestamp_global: '2023-01-01',
  reactivated_timestamp_agreement: '2024-05-01',
  disabled_timestamp_agreement: undefined,
  enabled_agreement: true,
  enabled_global: true,
  induction: { passed: true, passed_timestamp: '2024-01-02' },
  fleet_type: 'xxlarge',
  last_login: '2024-06-01',
  ...overrides,
});

export const createMockUserToAdd = (
  overrides: Partial<UserToAdd> = {},
): UserToAdd => ({
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  role: 'Analyst',
  user_id: 'user' + Math.random(),
  ...overrides,
});
