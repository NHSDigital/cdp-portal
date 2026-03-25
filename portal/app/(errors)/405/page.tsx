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
    title: `Error accessing page - ${whiteLabelValues.acronym}`,
  };
}

export default function Page405() {
  return (
    <>
      <h1>Error accessing page</h1>
      <p>Something went wrong when you tried to access this page.</p>
      <p>
        It could be that you accessed a page through an incorrect link. Please
        try again from the beginning or try again later.
      </p>
      <p>
        If you are seeing this page repeatedly, contact NHS England on{' '}
        {NATIONAL_SERVICE_DESK_TELEPHONE}, or email
        <a
          href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {NATIONAL_SERVICE_DESK_EMAIL}
        </a>
      </p>
      <BackLink href='/' label='Go back to home' />
    </>
  );
}
