import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

export default async function CDPContent() {
  return (
    <>
      <h1>Sign in to the Common Data Platform (CDP) Portal</h1>

      <p>The CDP Portal is the home page for CDP services.</p>
      <p>Sign into the Portal to:</p>
      <ul>
        <li>launch the virtual CDP desktop</li>
        <li>output your results</li>
      </ul>

      <p>If you are a User Manager, sign into the Portal to:</p>
      <ul>
        <li>add, view and manage your CDP users</li>
      </ul>

      <p>You must have an existing account to sign into the CDP Portal.</p>
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
