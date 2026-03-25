'use client';

import { useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

import { useAsyncError } from '@/helpers/errorHelpers';

import layoutStyles from './layout.module.css';

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const agreementId = params?.agreement_id || '';
  const throwAsyncError = useAsyncError();

  const onLogoutSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const resp = await fetch('/api/signout', {
      method: 'POST',
      body: JSON.stringify({
        agreement_id: agreementId,
        uses_js: true,
      }),
    });

    if (resp.status != 204) {
      throwAsyncError('Failed to logout');
    }

    await signOut({ callbackUrl: '/logout_confirm' });
  };

  return (
    <form method='POST' action='/api/signout' onSubmit={onLogoutSubmit}>
      <input type='hidden' name='agreement_id' value={agreementId} />
      <input type='hidden' name='uses_js' value='false' />
      <input
        type='submit'
        className={`nhsuk-button nhsuk-button--reverse ${layoutStyles.logoutButton}`}
        data-module='nhsuk-button'
        value='Logout'
        disabled={isLoading}
      />
    </form>
  );
}
