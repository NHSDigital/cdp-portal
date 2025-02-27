import getUsersInAgreement from "app/services/getUsersInAgreement";

interface GetFilteredUsersInAgreementProps {
  agreement_id: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function getFilteredUsersInAgreement({
  agreement_id,
  searchParams,
}: GetFilteredUsersInAgreementProps) {
  let { users, agreement } = await getUsersInAgreement(agreement_id);

  users = users.filter(
    (user) =>
      !user.application_roles_global?.includes("SupportAdministrator") &&
      !user.access_roles_global?.includes("data_wrangler")
  );

  const search_query = Array.isArray(searchParams.query)
    ? searchParams.query[0]
    : searchParams.query || null;

  if (search_query) {
    const search_query_words = search_query.trim().toLowerCase().split(" ");
    users = users.filter((user) => {
      // for each word in the search query
      // the user must have that word in their name or email
      const user_combined_string =
        `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase();
      return search_query_words.every((search_word) =>
        user_combined_string.includes(search_word)
      );
    });
  }

  const roles_queries = Array.isArray(searchParams.role)
    ? searchParams.role
    : searchParams.role
    ? [searchParams.role]
    : [];

  if (roles_queries.length > 0) {
    users = users.filter((user) =>
      roles_queries.some((role_query) => {
        if (
          role_query == "analyst" &&
          user.application_roles_agreement?.includes("Analyst")
        )
          return true;
        if (
          role_query == "user-manager" &&
          user.application_roles_agreement?.includes("UserManager")
        )
          return true;
        if (
          role_query == "both" &&
          user.application_roles_agreement?.includes("Analyst") &&
          user.application_roles_agreement?.includes("UserManager")
        )
          return true;
      })
    );
  }

  const status_queries = Array.isArray(searchParams.status)
    ? searchParams.status
    : searchParams.status
    ? [searchParams.status]
    : [];

  if (status_queries.length > 0) {
    users = users.filter((user) =>
      status_queries.some((status_query) => {
        // Currently there is no concept of "induction" in the database
        // So just return false for now
        if (
          status_query == "pending-induction" &&
          user.calculated_status === "Pending Induction"
        )
          return true;
        if (
          status_query == "activated" &&
          user.calculated_status === "Activated"
        )
          return true;
        if (
          status_query == "deactivated" &&
          user.calculated_status === "Deactivated"
        )
          return true;
      })
    );
  }

  // Sort users by last login date
  users = users.sort((user_a, user_b) => {
    const user_a_last_login = new Date(user_a.last_login || "0");
    const user_b_last_login = new Date(user_b.last_login || "0");

    if (user_a_last_login < user_b_last_login) {
      return 1;
    }
    if (user_a_last_login > user_b_last_login) {
      return -1;
    }
    return 0;
  });

  return { users, agreement };
}
