'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import React from 'react';

export default function WelcomeButton() {
  const callbackUrl: string | null | undefined =
    useSearchParams()?.get('callbackUrl');

  async function onLoginSubmit(event: React.SyntheticEvent) {
    event.preventDefault();

    await signIn('keycloak', {
      callbackUrl:
        (Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl) ?? '/',
    });
  }

  return (
    <form method='POST' action='/api/auth/signin' onSubmit={onLoginSubmit}>
      <button
        data-testid='welcome-button'
        type='submit'
        className='nhsuk-button'
      >
        Sign in
      </button>
    </form>
  );
}
