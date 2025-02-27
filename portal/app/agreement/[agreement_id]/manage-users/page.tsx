import styles from "./manage-users.module.css";
import { Metadata } from "next";
import BackLink from "app/shared/backLink";
import Link from "next/link";
import { cookies } from "next/headers";
import { StatusTag } from "app/shared/statusTags";
import { getFormattedTimestamp, NO_TIMESTAMP_TEXT } from "app/shared/common";
import SuccessBanner from "./successBanner";
import FiltersPane from "./filtersPane";
import getFilteredUsersInAgreement from "./getFilteredUsersInAgreement";
import { User } from "app/services/getUsersInAgreement";
import { WhatDoTheseStatusesMean } from "app/shared/statusTags";

export const metadata: Metadata = {
  title: "Manage users",
};

interface ManageUsersPageProps {
  params: { agreement_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ManageUsersPage({
  params,
  searchParams,
}: ManageUsersPageProps) {
  const { agreement_id } = params;

  const { users, agreement } = await getFilteredUsersInAgreement({
    agreement_id,
    searchParams,
  });

  const success_cookie = cookies().get("manage_users_success_message");

  return (
    <>
      <BackLink href="." />
      <span
        className="nhsuk-caption-l nhsuk-caption--bottom"
        data-cy="agreement_name"
      >
        {agreement.meaningful_name || agreement_id}
      </span>
      <h1 tabIndex={0}>
        Manage users{" "}
        <span
          className={styles.font_weight_regular}
          role="alert"
          aria-live="polite"
          aria-atomic={true}
        >
          ({users.length})
          <span className="nhsuk-u-visually-hidden">users found</span>
        </span>
      </h1>
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-one-third">
          <Link
            className="nhsuk-button"
            href={`/agreement/${agreement_id}/manage-users/add-user`}
          >
            Add a new user
          </Link>
        </div>
        {success_cookie && (
          <div className="nhsuk-grid-column-two-thirds">
            <SuccessBanner
              data-cy="success-banner"
              successMessage={success_cookie.value}
            />
          </div>
        )}
      </div>
      <div className="nhsuk-grid-row search">
        <FiltersPane />

        <section
          className="nhsuk-grid-column-two-thirds"
          aria-label="User list"
        >
          {users.length > 0 ? (
            <UserTable users={users} agreement_id={agreement_id} />
          ) : (
            <NoResultsFound />
          )}
        </section>
      </div>
    </>
  );
}

function NoResultsFound() {
  return (
    <>
      <h2>0 results found</h2>
      <p>Try:</p>
      <ul>
        <li>checking if the name or email address has been spelt correctly</li>
        <li>clearing your filters</li>
      </ul>
      <p>
        If the result you are looking for is still not listed{" "}
        <a href="https://digital.nhs.uk/about-nhs-digital/contact-us">
          contact us
        </a>
        .
      </p>
    </>
  );
}

const MANAGE_USERS_LIST_COLUMNS = [
  {
    key: "full_name",
    label: "Name",
  },
  {
    key: "last_login",
    label: "Last logged in",
  },
  {
    key: "status",
    label: "Status",
  },
];

function UserTable({ users, agreement_id }) {
  return (
    <div>
      <table
        role="table"
        className={`nhsuk-table-responsive ${styles.manage_user_table}`}
        data-cy="user-table"
      >
        <thead role="rowgroup" className="nhsuk-table__head">
          <tr role="row">
            {MANAGE_USERS_LIST_COLUMNS.map((column) => (
              <th role="columnheader" className="" scope="col" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="nhsuk-table__body">
          {users.map((user) => {
            const users_email = encodeURI(user.email);
            return (
              <UserTableRow
                user={user}
                agreement_id={agreement_id}
                key={users_email}
              />
            );
          })}
        </tbody>
      </table>
      <div className="nhsuk-u-margin-top-4">
        <WhatDoTheseStatusesMean />
      </div>
    </div>
  );
}

function UserTableRow({
  user,
  agreement_id,
}: {
  user: User;
  agreement_id: string;
}) {
  const users_full_name = `${user.first_name} ${user.last_name}`;

  const users_last_login = getFormattedTimestamp(user.last_login);

  const users_email = encodeURI(user.email);

  return (
    <tr role="row" className="nhsuk-table__row" key={users_email}>
      {/* Name column */}
      <td role="cell" className="nhsuk-table__cell">
        <Link
          href={`/agreement/${agreement_id}/manage-users/user/${users_email}`}
        >
          {users_full_name}
        </Link>
      </td>
      {/* Last Logged in column */}
      <td role="cell" className="nhsuk-table__cell">
        {users_last_login == NO_TIMESTAMP_TEXT && (
          <span className="nhsuk-u-visually-hidden">Never logged in</span>
        )}
        {users_last_login}
      </td>

      {/* Status column  */}
      <td role="cell" className="nhsuk-table__cell" data-cy="status">
        <StatusTag status={user.calculated_status} />
      </td>
    </tr>
  );
}
