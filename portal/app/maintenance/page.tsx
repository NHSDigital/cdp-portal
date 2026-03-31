import { Metadata } from 'next';

import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Maintenance page - ${whiteLabelValues.acronym}`,
  };
}

export default function MaintenancePage() {
  return (
    <>
      <h1>Service is unavailable</h1>
      <p>
        This service is currently undergoing maintenance and will be available
        soon. This should not take more than a few hours.
      </p>
      <p>
        If you have an urgent issue, contact the National Service Desk on{' '}
        {NATIONAL_SERVICE_DESK_TELEPHONE} or email{' '}
        <a
          href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {NATIONAL_SERVICE_DESK_EMAIL}
        </a>
      </p>
    </>
  );
}
