'use client';

import { useEffect } from 'react';

import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

import { getLogger } from '../helpers/logging/logger';
import BackLink from './shared/backLink';

const logger = getLogger('Error');

interface ErrorProps {
  error: Error & { digest?: string };
}

export default function Error({ error }: ErrorProps) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <>
      <h1>Sorry, there is a problem with the service</h1>
      <p>Try again later.</p>
      <p>
        If you need help using the SDE please raise a service request with our
        National Service Desk on {NATIONAL_SERVICE_DESK_TELEPHONE} or email{' '}
        <a
          href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {NATIONAL_SERVICE_DESK_EMAIL}
        </a>
        .
      </p>
      <p>
        To ensure your request is handled swiftly, please state that it relates
        to Secure Data Environment and include your NIC number (if known) and
        any relevant screenshots.
      </p>
      <BackLink href='/' label='Go back to home' />
    </>
  );
}
