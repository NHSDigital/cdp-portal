import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cookies } from "next/headers";

interface UseUserToDeleteFromSessionStorageProps {
  agreement_id: string;
  form_id: string;
  user_id: string;
}

export default function useUserToDeleteFromSessionStorage({
  agreement_id,
  form_id,
  user_id,
}: UseUserToDeleteFromSessionStorageProps) {
  const [userToDelete, setUserToDelete] = useState("");
  const router = useRouter();

  // Get the user to delete from session storage and update state
  useEffect(() => {
    const session_storage_item = sessionStorage.getItem("add_user_form");
    const users_to_add_dict = session_storage_item
      ? JSON.parse(session_storage_item)
      : undefined;

    if (users_to_add_dict?.[agreement_id]?.[form_id]?.[user_id] === undefined) {
      throw new Error("No users to delete.");
    }

    const user_to_delete = users_to_add_dict[agreement_id][form_id][user_id];
    const full_name = `${user_to_delete.first_name} ${user_to_delete.last_name}`;

    setUserToDelete(full_name);
  }, [agreement_id, form_id, user_id, setUserToDelete]);

  // Deletes a user from the list in session storage and updates state
  function deleteUser(user_id: string) {
    const session_storage_item = sessionStorage.getItem("add_user_form");
    const users_to_add_dict = session_storage_item
      ? JSON.parse(session_storage_item)
      : undefined;

    if (users_to_add_dict?.[agreement_id]?.[form_id] === undefined) {
      throw new Error("No users to delete.");
    }

    // Remove the user from the list
    const list_with_user_removed = Object.entries(
      users_to_add_dict[agreement_id][form_id]
    ).filter(([key, _]) => key !== user_id);

    // If the list is empty, remove the form from storage, delete cookie and redirect
    if (list_with_user_removed.length === 0) {
      sessionStorage.removeItem("add_user_form");
      document.cookie = `add_user_form=; expires = Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure`;
      router.push(`/agreement/${agreement_id}/manage-users`);
      return;
    }

    // If the list is not empty, update the session storage with the new list
    users_to_add_dict[agreement_id][form_id] = Object.fromEntries(
      list_with_user_removed
    );
    sessionStorage.setItem("add_user_form", JSON.stringify(users_to_add_dict));

    // Set the cookie to an existing user, this stops the user from being readded when redirected
    document.cookie = `add_user_form=${encodeURIComponent(
      JSON.stringify(list_with_user_removed[0][1])
    )}; path=/; secure`;

    // Redirect this way to force reload and ensure cached data is not used which can cause user to reappear
    location.href = `/agreement/${agreement_id}/manage-users/add-user/confirm?form_id=${form_id}`;
  }

  return { userToDelete, deleteUser };
}
