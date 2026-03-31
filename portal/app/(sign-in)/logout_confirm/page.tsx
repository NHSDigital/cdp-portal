import { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import BackLink from '@/app/shared/backLink';
import { getWhiteLabelValues } from '@/config/whiteLabel';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Logout successful - ${whiteLabelValues.acronym}`,
  };
}

export default async function LogoutConfirmPage() {
  const session = await getServerSession();

  if (session?.user) {
    throw new Error('User is still logged in');
  }

  return (
    <>
      <h1>You are logged out.</h1>
      <p>
        Please make sure to close any other tabs to ensure you are logged out
        completely.
      </p>
      <BackLink href='/' label='Go back to home' />
    </>
  );
}
