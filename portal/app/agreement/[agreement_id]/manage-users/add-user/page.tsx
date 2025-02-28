import { Metadata } from "next";
import React from "react";
import { getLogger } from "app/../helpers/logging/logger";
import AddUserForm from "./addUserForm";
import submitAddUserForm from "app/agreement/[agreement_id]/manage-users/add-user/submitAddUserForm";
import { redirect } from "next/navigation";

const logger = getLogger("addUserForm");

export const metadata: Metadata = {
  title: "Add a new user",
};

export interface AddUserPageProps {
  params: { agreement_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AddUserPage({
  params,
  searchParams,
}: AddUserPageProps) {
  let form_id = searchParams.form_id;
  let user_id = searchParams.user_id;

  if (typeof form_id !== "string" || typeof user_id !== "string") {
    form_id = typeof form_id === "string" ? form_id : createRandomId();
    user_id = typeof user_id === "string" ? user_id : createRandomId();

    redirect(
      `/agreement/${params.agreement_id}/manage-users/add-user?form_id=${form_id}&user_id=${user_id}`
    );
  }

  let addUserAction = submitAddUserForm.bind(null, params.agreement_id);
  addUserAction = addUserAction.bind(null, form_id);
  addUserAction = addUserAction.bind(null, user_id);
  return (
    <div className="nhsuk-grid-row">
      <div className="nhsuk-grid-column-three-quarters">
        <AddUserForm
          agreement_id={params.agreement_id}
          addUserAction={addUserAction}
          form_id={form_id}
          user_id={user_id}
        />
      </div>
    </div>
  );
}

function createRandomId() {
  return Math.ceil(Math.random() * 1000000).toString();
}
