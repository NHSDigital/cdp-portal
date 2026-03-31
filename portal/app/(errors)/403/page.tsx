import { Metadata } from 'next';

import BackLink from '@/app/shared/backLink';
import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Method not allowed - ${whiteLabelValues.acronym}`,
  };
}

export default function Page403() {
  return (
    <>
      <h1>You do not have permission to access this page</h1>
      <p>
        If you are seeing this page in error, contact the National Service Desk
        on {NATIONAL_SERVICE_DESK_TELEPHONE} or email{' '}
        <a
          href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {NATIONAL_SERVICE_DESK_EMAIL}
        </a>
        .
      </p>
      <BackLink href='/' label='Go back to home' />
    </>
  );
}
