import useHasJavascript from "app/shared/useHasJavascript";
import Link from "next/link";

interface DeleteUserLinkProps {
  agreement_id: string;
  form_id: string;
  user_id: string;
}

export default function DeleteUserLink({
  agreement_id,
  form_id,
  user_id,
}: DeleteUserLinkProps) {
  if (useHasJavascript()) {
    return (
      <Link
        href={`/agreement/${agreement_id}/manage-users/add-user/confirm/delete-user?form_id=${form_id}&user_id=${user_id}`}
      >
        Delete
      </Link>
    );
  } else {
    return (
      <Link href={`/agreement/${agreement_id}/manage-users/`}>Delete</Link>
    );
  }
}
