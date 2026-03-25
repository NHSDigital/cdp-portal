import { Metadata } from 'next';

import BackLink from '@/app/shared/backLink';

export const metadata: Metadata = {
  title: 'Aborting Virtual Desktop',
};

export default function LockedPage() {
  return (
    <>
      <h1>
        We are still aborting your previous request to launch the virtual
        desktop
      </h1>
      <p>
        This can happen when the virtual desktop is launched in quick
        succession.
      </p>
      <p>Please go back to the home page and try again.</p>
      <BackLink href='/' label='Go back to home' />
    </>
  );
}
