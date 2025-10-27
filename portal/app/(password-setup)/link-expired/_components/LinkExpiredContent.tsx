'use client';

import SuccessBanner from 'app/_components/SuccessBanner';
import SubmitButton from 'app/shared/submitButtonClient';
import React from 'react';
import { useFormState } from 'react-dom';

import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

import { invokeResendEmail, invokeResendEmailType } from './serverActions';

const initialFormState: invokeResendEmailType = {
  success: false,
};

export default function LinkExpiredContent({ email }: { email: string }) {
  const [formState, formAction] = useFormState(
    invokeResendEmail,
    initialFormState,
  );

  return (
    <>
      {formState.success && (
        <SuccessBanner
          data-cy='success-banner'
          successMessage={'Your email has been resent'}
        />
      )}
      <h1>Setup link expired</h1>
      <p>The link to set up your account has expired.</p>
      <p>
        You can request a new link. The link in the email will be valid for 24
        hours.
      </p>
      <p>
        If you&apos;re seeing this message in error, contact support at{' '}
        <a
          href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {NATIONAL_SERVICE_DESK_EMAIL}
        </a>{' '}
        or call {NATIONAL_SERVICE_DESK_TELEPHONE}.
      </p>
      <form action={formAction}>
        <input type='hidden' name='email' value={email} />
        <SubmitButton>Request a new link</SubmitButton>
      </form>
    </>
  );
}
