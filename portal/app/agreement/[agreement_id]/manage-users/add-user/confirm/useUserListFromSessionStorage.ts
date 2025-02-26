import { useEffect, useState } from "react";
import { UserToAdd } from "./types";

interface UseUserListFromSessionStorageProps {
  latest_user_to_add: UserToAdd;
  agreement_id: string;
  form_id: string;
}

export default function useUserListFromSessionStorage({
  latest_user_to_add,
  agreement_id,
  form_id,
}: UseUserListFromSessionStorageProps) {
  const [users_to_display, setUsersToDisplay] = useState([latest_user_to_add]);

  // Appends the latest user to the list in session storage and updates state
  useEffect(() => {
    const user_id = latest_user_to_add.user_id;
    const session_storage_item = sessionStorage.getItem("add_user_form");
    const users_to_add_dict = session_storage_item
      ? JSON.parse(session_storage_item)
      : undefined;

    if (users_to_add_dict?.[agreement_id]?.[form_id] === undefined) {
      const form_content = {
        [agreement_id]: {
          [form_id]: {
            [user_id]: latest_user_to_add,
          },
        },
      };
      sessionStorage.setItem("add_user_form", JSON.stringify(form_content));
      return;
    }

    for (const [user_id, user_details] of Object.entries(
      users_to_add_dict[agreement_id][form_id]
    )) {
      if (typeof user_details === "object" && user_details !== null) {
        if (user_details.hasOwnProperty("email")) {
          if (latest_user_to_add.email === user_details["email"]) {
            delete users_to_add_dict[agreement_id][form_id][user_id];
          }
        }
      }
    }

    users_to_add_dict[agreement_id][form_id][user_id] = latest_user_to_add;
    sessionStorage.setItem("add_user_form", JSON.stringify(users_to_add_dict));
    setUsersToDisplay(Object.values(users_to_add_dict[agreement_id][form_id]));
  }, [setUsersToDisplay, latest_user_to_add, agreement_id, form_id]);

  return users_to_display;
}
