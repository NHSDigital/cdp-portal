import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ConfirmClient from "./confirmClient";
import { createOneUserServerActionNoJS } from "./serverActions";

export const metadata: Metadata = {
  title: "Confirm user details",
};

interface ConfirmAddUserPageProps {
  params: { agreement_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

function getLatestAddedUserFromCookie(agreement_id: string) {
  const add_user_form_cookie = cookies().get("add_user_form");
  if (!add_user_form_cookie) {
    redirect(`/agreement/${agreement_id}/manage-users/add-user`);
  }

  // We should really validate the details below, but that's for a different ticket
  return JSON.parse(add_user_form_cookie.value);
}

export default async function AddUserPage({
  params,
  searchParams,
}: ConfirmAddUserPageProps) {
  const latest_added_user_details = getLatestAddedUserFromCookie(
    params.agreement_id
  );
  const form_id = searchParams.form_id;

  if (typeof form_id !== "string") {
    redirect(`/agreement/${params.agreement_id}/manage-users/add-user`);
  }

  const user_to_add = {
    first_name: latest_added_user_details.first_name,
    last_name: latest_added_user_details.last_name,
    email: latest_added_user_details.email,
    role: latest_added_user_details.role,
    user_id: latest_added_user_details.user_id,
  };

  return (
    <>
      <ConfirmClient
        latest_user_to_add={user_to_add}
        form_id={form_id}
        agreement_id={params.agreement_id}
        createOneUserNoJS={createOneUserServerActionNoJS.bind(
          null,
          params.agreement_id
        )}
      />
    </>
  );
}
