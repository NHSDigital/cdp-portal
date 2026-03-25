import BackLink from '@/app/shared/backLink';
import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

export default function UnexpectedError() {
  return (
    <>
      <h1>Sorry, there is a problem with the service</h1>
      <p>Try again later.</p>
      <p>
        If you need help using the service please raise a request with our
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
