import getAgreementUserDetails from 'app/services/getAgreementUserDetails';
import BackLink from 'app/shared/backLink';
import { WhatDoTheseStatusesMean } from 'app/shared/statusTags';
import { getLogger } from 'helpers/logging/logger';
import { Metadata } from 'next';
import { cookies } from 'next/headers';

import { NATIONAL_SERVICE_DESK_EMAIL } from '@/config/constants';

import SuccessBanner from '../../successBanner';
import UserDescriptionList from './userDescriptionList';

const logger = getLogger('userDetailsPage');

export const metadata: Metadata = {
  title: 'User details',
};

interface ManageUsersPageProps {
  params: { agreement_id: string; user: string };
}

export default async function userDetailsPage({
  params,
}: ManageUsersPageProps) {
  const { agreement_id, user } = params;

  const user_decoded = decodeURIComponent(user);

  logger.info('Retrieveing agreement user details');
  const user_details = await getAgreementUserDetails(
    agreement_id,
    user_decoded,
  );

  const users_full_name = `${user_details.first_name} ${user_details.last_name}`;

  const success_cookie = cookies().get('manage_users_success_message');

  return (
    <div>
      <BackLink href='..' />
      <h1>{users_full_name}</h1>
      <div>
        {success_cookie && (
          <SuccessBanner successMessage={success_cookie.value} />
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
      />

      <WhatDoTheseStatusesMean />
    </div>
  );
}
