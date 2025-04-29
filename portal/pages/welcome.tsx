import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getServerSession, Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

import {
  NATIONAL_SERVICE_DESK_EMAIL,
  NATIONAL_SERVICE_DESK_TELEPHONE,
} from '@/config/constants';

import BasePage from '../components/BasePage';
import WelcomeButton from '../components/WelcomeButton';
import getNotifications, { Notices } from '../services/getNotifications';
import { authOptions } from './api/auth/[...nextauth]';

export default function Welcome({ notificationItems }: Notices) {
  const mainRef = useRef(null);

  // Auto redirect if logged in (say, in a different tab)
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.data) {
      router.push(
        (Array.isArray(router.query.callbackUrl)
          ? router.query.callbackUrl[0]
          : router.query.callbackUrl) || '/',
      );
    }
  });

  return (
    <BasePage mainRef={mainRef} notificationItems={notificationItems}>
      <Head>
        <title>Welcome to the NHS Secure Data Environment</title>
      </Head>
      <main style={{ paddingTop: '4rem', paddingBottom: '4rem' }} ref={mainRef}>
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
        <WelcomeButton></WelcomeButton>
      </main>
    </BasePage>
  );
}

export const getServerSideProps: GetServerSideProps<Notices> = async (
  context,
) => {
  const session = (await getServerSession(
    context.req,
    context.res,
    authOptions,
  )) as Session;
  if (session) {
    let { callbackUrl } = context.query;
    if (Array.isArray(callbackUrl)) callbackUrl = callbackUrl[0];
    if (!callbackUrl) callbackUrl = '/';

    return {
      redirect: {
        destination: callbackUrl,
        permanent: false,
      },
    };
  }

  const notificationItems = await getNotifications();

  return {
    props: {
      notificationItems,
    },
  };
};
