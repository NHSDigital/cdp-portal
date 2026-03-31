import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

export default function SDEContent() {
  return (
    <>
      <h1>Sign in to the Secure Data Environment (SDE) Portal</h1>

      <p>The SDE Portal is the home page for SDE services.</p>
      <p>Sign into the Portal to:</p>
      <ul>
        <li>launch the virtual SDE desktop</li>
        <li>import reference data files</li>
        <li>output your results</li>
      </ul>

      <p>If you are a User Manager, sign into the Portal to:</p>
      <ul>
        <li>add, view and manage your SDE users</li>
      </ul>
      <p>You will not be charged for managing users on the SDE.</p>

      <p>You must have an existing account to sign into the SDE Portal.</p>
      <p>
        For issues with signing in, contact the National Service Desk on{' '}
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
