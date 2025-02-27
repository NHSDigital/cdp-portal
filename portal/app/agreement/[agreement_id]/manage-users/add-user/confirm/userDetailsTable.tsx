import DeleteUserLink from "./deleteUserLink";
import { UserToAdd } from "./types";
import style from "./userDetailsTable.module.css";
import Link from "next/link";

interface UsersToAddTableProps {
  users: UserToAdd[];
  agreement_id: string;
  form_id: string;
}

export default function UserDetailsTable({
  users,
  agreement_id,
  form_id,
}: UsersToAddTableProps) {
  return (
    <table
      role="table"
      className="nhsuk-table-responsive nhsuk-u-margin-bottom-4"
    >
      <thead role="rowgroup" className="nhsuk-table__head">
        <tr role="row">
          <th role="columnheader" scope="col">
            First Name
          </th>
          <th role="columnheader" scope="col">
            Last Name
          </th>
          <th role="columnheader" scope="col">
            Email
          </th>
          <th role="columnheader" scope="col">
            Role
          </th>
          <th role="columnheader" scope="col">
            Edit
          </th>
          <th role="columnheader" scope="col">
            Delete
          </th>
        </tr>
      </thead>
      <tbody className="nhsuk-table__body">
        {users.map((user) => (
          <UserToAddRow
            user={user}
            key={user.user_id}
            agreement_id={agreement_id}
            form_id={form_id}
          />
        ))}
      </tbody>
    </table>
  );
}

interface UserToAddRowProps {
  user: UserToAdd;
  agreement_id: string;
  form_id: string;
}

function UserToAddRow({ user, agreement_id, form_id }: UserToAddRowProps) {
  const { first_name, last_name, email, role, user_id } = user;
  return (
    <tr role="row" className="nhsuk-table__row">
      <td role="cell" className={`nhsuk-table__cell ${style.wrapTableCell}`}>
        <span className="nhsuk-table-responsive__heading">First Name </span>
        {first_name}
      </td>
      <td role="cell" className={`nhsuk-table__cell ${style.wrapTableCell}`}>
        <span className="nhsuk-table-responsive__heading">Last Name </span>
        {last_name}
      </td>
      <td role="cell" className={`nhsuk-table__cell ${style.wrapTableCell}`}>
        <span className="nhsuk-table-responsive__heading">Email </span>
        {email}
      </td>
      <td role="cell" className="nhsuk-table__cell">
        <span className="nhsuk-table-responsive__heading">Role </span>
        <RoleCell role_id={role} />
      </td>
      <td role="cell" className="nhsuk-table__cell">
        <span className="nhsuk-u-visually-hidden">Edit user details</span>
        <Link
          href={`/agreement/${agreement_id}/manage-users/add-user?form_id=${form_id}&user_id=${user_id}`}
        >
          Edit
        </Link>
      </td>
      <td role="cell" className="nhsuk-table__cell">
        <span className="nhsuk-u-visually-hidden">Delete user</span>
        <DeleteUserLink
          agreement_id={agreement_id}
          form_id={form_id}
          user_id={user_id}
        />
      </td>
    </tr>
  );
}

function RoleCell({ role_id }: { role_id: string }) {
  switch (role_id) {
    case "UserManager":
      return "User Manager";
    case "Analyst":
      return "Data Analyst";
    case "Both":
      return (
        <>
          Both <br />
          (Data Analyst and User Manager)
        </>
      );
  }
}
