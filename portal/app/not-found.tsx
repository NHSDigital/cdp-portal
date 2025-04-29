import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

import BackLink from './shared/backLink';

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>If you typed the web address, check it is correct.</p>
      <p>
        If you pasted the web address, check that you copied the entire address.
      </p>
      <p>
        If the web address is correct or you selected a link or button, contact
        NHS England on {NATIONAL_SERVICE_DESK_TELEPHONE}, or email{' '}
        <a
          href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {NATIONAL_SERVICE_DESK_EMAIL}
        </a>
      </p>
      <BackLink href='/' />
    </>
  );
}
