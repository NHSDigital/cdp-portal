"use client";

import useHasJavascript from "app/shared/useHasJavascript";
import Link from "next/link";

interface AddAnotherUserProps {
  form_id: string;
  agreement_id: string;
}

export default function AddAnotherUserLink({
  form_id,
  agreement_id,
}: AddAnotherUserProps) {
  const hasJavascript = useHasJavascript();

  if (hasJavascript) {
    return (
      <p>
        <Link
          href={`/agreement/${agreement_id}/manage-users/add-user?form_id=${form_id}`}
        >
          Add another user
        </Link>
      </p>
    );
  } else {
    return null;
  }
}
