import getUsersInAgreement, { User } from 'app/services/getUsersInAgreement';

interface GetFilteredUsersInAgreementProps {
  agreement_id: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function getFilteredUsersInAgreement({
  agreement_id,
  searchParams,
}: GetFilteredUsersInAgreementProps) {
  // eslint-disable-next-line prefer-const
  let { users, agreement } = await getUsersInAgreement(agreement_id);
  const resolvedSearchParams = await searchParams;

  users = users.filter(
    (user) =>
      !user.application_roles_global?.includes('SupportAdministrator') &&
      !user.access_roles_global?.includes('data_wrangler'),
  );

  const search_query = Array.isArray(resolvedSearchParams.query)
    ? resolvedSearchParams.query[0]
    : resolvedSearchParams.query || null;

  if (search_query) {
    const search_query_words = search_query.trim().toLowerCase().split(' ');
    users = users.filter((user) =>
      userMatchesAllSearchWords(user, search_query_words),
    );
  }

  const roles_queries = Array.isArray(resolvedSearchParams.role)
    ? resolvedSearchParams.role
    : resolvedSearchParams.role
      ? [resolvedSearchParams.role]
      : [];

  if (roles_queries.length > 0) {
    users = users.filter((user) =>
      roles_queries.some((role_query) => {
        if (
          role_query == 'analyst' &&
          user.application_roles_agreement?.includes('Analyst')
        )
          return true;
        if (
          role_query == 'user-manager' &&
          user.application_roles_agreement?.includes('UserManager')
        )
          return true;
        if (
          role_query == 'both' &&
          user.application_roles_agreement?.includes('Analyst') &&
          user.application_roles_agreement?.includes('UserManager')
        )
          return true;
      }),
    );
  }

  const status_queries = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status
    : resolvedSearchParams.status
      ? [resolvedSearchParams.status]
      : [];

  if (status_queries.length > 0) {
    users = users.filter((user) =>
      status_queries.some((status_query) => {
        // Currently there is no concept of "induction" in the database
        // So just return false for now - SDE- 10362
        if (
          status_query == 'pending-induction' &&
          user.calculated_status === 'Pending Induction'
        )
          return true;
        if (
          status_query == 'activated' &&
          user.calculated_status === 'Activated'
        )
          return true;
        if (
          status_query == 'deactivated' &&
          user.calculated_status === 'Deactivated'
        )
          return true;
      }),
    );
  }

  users = sortUsersByLastLoginDate(users);

  return { users, agreement };
}

/**
 * Returns true if *all* words from the search query appear in the user's
 * name or email (case-insensitive). This allows partial matches like:
 *   "bo test" → matches "Bob Tester bob@test.com"
 */
export function userMatchesAllSearchWords(
  user: User,
  searchWords: string[],
): boolean {
  const searchable =
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase();
  return searchWords.every((word) => searchable.includes(word));
}

export function sortUsersByLastLoginDate(users: User[]): User[] {
  users.sort((user_a, user_b) => {
    const user_a_last_login = new Date(user_a.last_login || '0');
    const user_b_last_login = new Date(user_b.last_login || '0');

    if (user_a_last_login < user_b_last_login) {
      return 1;
    }
    if (user_a_last_login > user_b_last_login) {
      return -1;
    }
    return 0;
  });

  return users;
}
