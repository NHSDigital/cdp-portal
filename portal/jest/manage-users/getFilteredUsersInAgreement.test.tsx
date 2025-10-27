import getFilteredUsersInAgreement, {
  sortUsersByLastLoginDate,
  userMatchesAllSearchWords,
} from '@/app/agreement/[agreement_id]/manage-users/_components/getFilteredUsersInAgreement';
import getUsersInAgreement, { User } from '@/app/services/getUsersInAgreement';

jest.mock('@/app/services/getUsersInAgreement');

const baseUser: User = {
  first_name: '',
  last_name: '',
  email: '',
  calculated_status: 'Activated',
  last_login: undefined,
  application_roles_global: [],
  access_roles_global: [],
  application_roles_agreement: [],
  enabled_global: true,
  enabled_agreement: true,
  induction: { passed: true, passed_timestamp: '2024-01-01' },
};
const mockUsers: User[] = [
  {
    ...baseUser,
    first_name: 'Yogi',
    last_name: 'Bear',
    email: 'yogi@test.com',
    calculated_status: 'Activated',
    last_login: '2024-01-01',
    application_roles_agreement: ['Analyst'],
  },
  {
    ...baseUser,
    first_name: 'Booboo',
    last_name: 'Bear',
    email: 'booboo@test.com',
    calculated_status: 'Pending Induction',
    last_login: '2024-01-01',
    application_roles_agreement: ['Analyst'],
  },
  {
    ...baseUser,
    first_name: 'Pepper',
    last_name: 'Pig',
    email: 'pepper@test.com',
    calculated_status: 'Deactivated',
    last_login: '2023-12-01',
    application_roles_agreement: ['UserManager', 'Analyst'],
  },
  {
    ...baseUser,
    first_name: 'Charlie',
    last_name: 'Chalk',
    email: 'charlie@test.com',
    calculated_status: 'Pending Induction',
    last_login: undefined,
    application_roles_global: ['SupportAdministrator'],
    application_roles_agreement: ['UserManager'],
  },
  {
    ...baseUser,
    first_name: 'Pink',
    last_name: 'Panther',
    email: 'pink@test.com',
    calculated_status: 'Activated',
    last_login: undefined,
    access_roles_global: ['data_wrangler'],
    application_roles_agreement: ['UserManager'],
  },
];

const mockAgreement = { id: 'mock-agreement' };

beforeEach(() => {
  jest.resetAllMocks();
  (getUsersInAgreement as jest.Mock).mockResolvedValue({
    users: mockUsers,
    agreement: mockAgreement.id,
  });
});

describe('getFilteredUsersInAgreement tests', () => {
  it('filters out SupportAdministrator and data_wrangler users', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: {},
    });
    expect(users).toHaveLength(3);
    expect(users.map((u) => u.email)).toContain('yogi@test.com');
    expect(users.map((u) => u.email)).toContain('pepper@test.com');
    expect(users.map((u) => u.email)).toContain('booboo@test.com');
    expect(users.map((u) => u.email)).not.toContain('charlie@test.com');
  });

  it('filters users by search query', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: { query: 'pepper pig' },
    });
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('pepper@test.com');
  });

  it('filters users by role = analyst', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: { role: 'analyst' },
    });
    expect(users).toHaveLength(3);
    expect(users.map((u) => u.email)).toContain('yogi@test.com');
    expect(users.map((u) => u.email)).toContain('pepper@test.com');
    expect(users.map((u) => u.email)).toContain('booboo@test.com');
  });

  it('filters users by role = user-manager', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: { role: 'user-manager' },
    });
    expect(users).toHaveLength(1);
    expect(users.map((u) => u.email)).toContain('pepper@test.com');
  });

  it('filters users by role = both', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: { role: 'both' },
    });

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('pepper@test.com');
  });

  it('filters users by status = activated', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: { status: 'activated' },
    });
    expect(users).toHaveLength(1);
    expect(users.map((u) => u.email)).toContain('yogi@test.com');
  });

  it('filters users by status = deactivated', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: { status: 'deactivated' },
    });
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('pepper@test.com');
  });

  it('filters users by status = pending induction', async () => {
    const { users } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: { status: 'pending-induction' },
    });

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('booboo@test.com');
  });

  it('sorts users by last login descending', async () => {
    const { users: firstUsers } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: {},
    });

    expect(firstUsers).toHaveLength(3);
    expect(firstUsers[0].email).toBe('yogi@test.com');
    expect(firstUsers[1].email).toBe('booboo@test.com');
    expect(firstUsers[2].email).toBe('pepper@test.com');

    const updatedUsers = mockUsers.map((user) => {
      if (user.email === 'pepper@test.com') {
        return { ...user, last_login: '2025-07-10T00:00:00Z' };
      }
      if (user.email === 'booboo@test.com') {
        return { ...user, last_login: '2024-01-01T00:00:00Z' };
      }
      if (user.email === 'yogi@test.com') {
        return { ...user, last_login: '2023-01-01T00:00:00Z' };
      }
      return user;
    });

    (getUsersInAgreement as jest.Mock).mockResolvedValueOnce({
      users: updatedUsers,
      agreement: mockAgreement,
    });

    const { users: sortedUsers } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: {},
    });

    expect(sortedUsers[0].email).toBe('pepper@test.com');
    expect(sortedUsers[1].email).toBe('booboo@test.com');
    expect(sortedUsers[2].email).toBe('yogi@test.com');
  });

  it('handles multiple role/status/search values as arrays', async () => {
    const { users, agreement } = await getFilteredUsersInAgreement({
      agreement_id: mockAgreement.id,
      searchParams: {
        role: ['analyst', 'user-manager'],
        status: ['activated', 'deactivated'],
        query: ['test'],
      },
    });
    expect(agreement).toBe(mockAgreement.id);
    expect(users).toHaveLength(2);
    expect(users.map((u) => u.email)).toContain('yogi@test.com');
    expect(users.map((u) => u.email)).toContain('pepper@test.com');
  });
});

describe('userMatchesAllSearchWords tests', () => {
  const mockUser = {
    first_name: 'Daffy',
    last_name: 'Duck',
    email: 'daffy@test.com',
  } as User;

  it('returns true when all search words match', () => {
    expect(userMatchesAllSearchWords(mockUser, ['daffy'])).toBe(true);
    expect(userMatchesAllSearchWords(mockUser, ['duck'])).toBe(true);
    expect(userMatchesAllSearchWords(mockUser, ['daffy', 'duck'])).toBe(true);
  });

  it('returns false if any word does not match', () => {
    expect(userMatchesAllSearchWords(mockUser, ['nope'])).toBe(false);
    expect(userMatchesAllSearchWords(mockUser, ['daffy', 'unknown'])).toBe(
      false,
    );
  });
});

describe('sortUsersByLastLoginDate', () => {
  it('returns users sorted by last login descending and places users without logins at the bottom', () => {
    const sorted = sortUsersByLastLoginDate(mockUsers);
    const emails = sorted.map((user) => user.email);

    expect(emails[0]).toBe('yogi@test.com');
    expect(emails[1]).toBe('booboo@test.com');
    expect(emails[2]).toBe('pepper@test.com');
    expect(emails.slice(3, 5)).toEqual(
      expect.arrayContaining(['charlie@test.com', 'pink@test.com']),
    );
  });
});
