"use client";

import useUserToDeleteFromSessionStorage from "./useUserToDeleteFromSessionStorage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorSummary from "app/shared/errorSummary";
import RadioInputs from "./radioInputs";
import SubmitButton from "app/shared/submitButton";

interface DeleteClientProps {
  agreement_id: string;
  form_id: string;
  user_id: string;
}

export default function DeleteClient({
  agreement_id,
  form_id,
  user_id,
}: DeleteClientProps) {
  const { userToDelete, deleteUser } = useUserToDeleteFromSessionStorage({
    agreement_id,
    form_id,
    user_id,
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const errorSummaryInput = [
    {
      input_id: "confirm-yes-input",
      errors_list: error ? [error] : undefined,
    },
  ];

  // NHS service manual states must move focus to error summary when it appears
  useEffect(() => {
    document.getElementById("error-summary")?.focus();
  }, [error]);

  function handleSubmit(submit_event: any) {
    submit_event.preventDefault();
    const form_data = new FormData(submit_event.target);
    const confirm_response = form_data.get("confirm");

    if (!confirm_response) {
      setError("Please select an option");
      return;
    }
    if (confirm_response === "yes") {
      deleteUser(user_id);
      return;
    }
    if (confirm_response === "no") {
      router.push(
        `/agreement/${agreement_id}/manage-users/add-user/confirm?form_id=${form_id}`
      );
      return;
    }
  }

  return (
    <>
      <ErrorSummary errors={errorSummaryInput} />
      <form onSubmit={(e) => handleSubmit(e)}>
        <fieldset
          className="nhsuk-fieldset nhsuk-u-margin-bottom-4"
          aria-describedby="delete-hint"
        >
          <legend>
            <h1>Delete {userToDelete}</h1>
          </legend>
          <p className="nhsuk-hint" id="delete-hint">
            Confirm that you want to delete this user&apos;s details.
          </p>
          <RadioInputs errors={error} />
        </fieldset>
        <SubmitButton>Continue</SubmitButton>
      </form>
    </>
  );
}
