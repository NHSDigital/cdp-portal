import getAgreementUserDetails from 'app/services/getAgreementUserDetails';
import BackLink from 'app/shared/backLink';
import { getLogger } from 'helpers/logging/logger';
import { Metadata } from 'next';
import { cookies } from 'next/headers';

import { WhatDoTheseStatusesMean } from '@/app/_components/status-tags/StatusTags';
import { CookieNames, NATIONAL_SERVICE_DESK_EMAIL } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import UserDescriptionList from './_components/UserDescriptionList';
import SuccessBannerClient from './success-banner-client';

const logger = getLogger('userDetailsPage');

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `User details - ${whiteLabelValues.acronym}`,
  };
}

interface ManageUsersPageProps {
  params: Promise<{ agreement_id: string; user: string }>;
}

export default async function userDetailsPage({
  params,
}: ManageUsersPageProps) {
  const { agreement_id, user } = await params;

  const user_decoded = decodeURIComponent(user);

  logger.info('Retrieveing agreement user details');
  const user_details = await getAgreementUserDetails(
    agreement_id,
    user_decoded,
  );

  const users_full_name = `${user_details.first_name} ${user_details.last_name}`;

  const success_cookie = (await cookies()).get(
    CookieNames.MANAGE_USERS_SUCCESS_MESSAGE,
  );

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <div>
      <BackLink href='..' />
      <h1>{users_full_name}</h1>
      <div>
        {success_cookie && (
          <SuccessBannerClient message={success_cookie.value} />
        )}
      </div>
      <p>
        To update this user&apos;s name or email address, contact support at{' '}
        <a
          href={`mailto:${NATIONAL_SERVICE_DESK_EMAIL}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          {NATIONAL_SERVICE_DESK_EMAIL}
        </a>
        .
      </p>

      <UserDescriptionList
        agreement_id={agreement_id}
        user_details={user_details}
        whiteLabelKey={whiteLabelValues.acronym}
      />

      <WhatDoTheseStatusesMean whiteLabelKey={whiteLabelValues.acronym} />
    </div>
  );
}
