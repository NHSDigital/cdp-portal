import Link from 'next/link';
import React from 'react';

export function ChangeRoleLink({
  agreement_id,
  user,
}: {
  agreement_id: string;
  user: string;
}) {
  return (
    <Link
      data-cy='change-role-link'
      href={`/agreement/${agreement_id}/manage-users/user/${user}/change-role`}
    >
      Change role
    </Link>
  );
}
