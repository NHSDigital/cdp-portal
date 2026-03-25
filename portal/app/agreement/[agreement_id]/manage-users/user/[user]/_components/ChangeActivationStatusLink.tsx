import Link from 'next/link';
import React from 'react';

export function ChangeActivationStatusLink({
  status,
  agreement_id,
  user,
}: {
  status: string;
  agreement_id: string;
  user: string;
}) {
  const link_contents =
    status === 'Activated' || status === 'Pending Induction'
      ? 'Deactivate user'
      : 'Reactivate user';

  return (
    <Link
      data-cy='change-activation-link'
      href={`/agreement/${agreement_id}/manage-users/user/${user}/confirm-change-activation`}
    >
      {link_contents}
    </Link>
  );
}
