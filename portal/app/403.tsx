import { Metadata } from 'next';

import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

export const metadata: Metadata = {
  title: 'Method not allowed',
};

export default function Page403() {
  return (
    <>
      <div className='nhsuk-grid-row'>
        <div className='nhsuk-grid-column-three-quarters'>
          <h1>You do not have permission to access this page</h1>
          <p>
            If you are seeing this page in error, contact the National Service
            Desk on {NATIONAL_SERVICE_DESK_TELEPHONE} or email{' '}
            <a
              href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              {NATIONAL_SERVICE_DESK_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
