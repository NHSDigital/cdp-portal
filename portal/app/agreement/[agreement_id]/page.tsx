import hasFeatureFlagEnabled from 'app/services/hasFeatureFlagEnabled';
import hasPermissions from 'app/services/hasPermissions';
import BackLink from 'app/shared/backLink';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import React from 'react';
import getUserAgreements from 'services/getUserAgreements';

import getCardColumnWidth from '@/app/agreement/[agreement_id]/_components/getCardColumnWidth';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import { FeatureFlags, Permissions } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import IsSDEAgreement from '@/helpers/agreementidHelper';

import { ServiceCard } from './_components/ServiceCard';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Portal - ${whiteLabelValues.acronym}`,
  };
}

interface IAgreementProps {
  params: { agreement_id: string };
}

export default async function AgreementPage({
  params: { agreement_id },
}: IAgreementProps) {
  const inductionFeatureFlagEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.INDUCTION,
  });
  const session = await getServerSession();

  const user_email = session?.user?.email || '';

  const { activeAgreements, inductionNeeded, inductionPassed } =
    await getUserAgreements(session?.user?.email || '');

  const inductionRedirectTarget = getInductionRedirectTarget({
    inductionFeatureFlagEnabled,
    inductionNeeded,
    inductionPassed,
  });

  if (inductionRedirectTarget) {
    redirect(inductionRedirectTarget);
  }

  const manageUsersEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.USER_MANAGEMENT,
  });

  const [
    hasOpenAgreementPermission,
    hasUploadFilePermission,
    hasManageUsersPermission,
  ] = await Promise.all(
    [
      Permissions.OPEN_AGREEMENT,
      Permissions.UPLOAD_FILE,
      Permissions.GET_AGREEMENT_USERS,
    ].map((permission) =>
      hasPermissions({
        permissions_required: [permission],
        agreement_id,
        user_email,
      }),
    ),
  );

  const hasMultipleAgreements = activeAgreements.length > 1;

  // Define guidance_required variable
  const noGuidanceAgreements = ['review_file', 'digitrials-fss'];
  const isCdaAgreement = /^cda-.*/.test(agreement_id);

  const isSdeAgreement = await IsSDEAgreement(agreement_id);
  const manageUsersCard = manageUsersEnabled && hasManageUsersPermission;
  const launchVDICard = hasOpenAgreementPermission;
  const uploadRefDataCard = hasUploadFilePermission && isSdeAgreement;
  const guidanceCard =
    !noGuidanceAgreements.includes(agreement_id) || isCdaAgreement;
  const totalCards = [
    manageUsersCard,
    launchVDICard,
    uploadRefDataCard,
    guidanceCard,
  ].filter(Boolean).length;

  const cardColumnWidth = getCardColumnWidth(totalCards);

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <>
      {hasMultipleAgreements && <BackLink href='/' />}
      <h1>
        {whiteLabelValues.longName} ({whiteLabelValues.acronym}) Portal
      </h1>
      <p>Access your online services for {agreement_id}</p>
      <ul className='nhsuk-grid-row nhsuk-card-group'>
        {manageUsersCard && (
          <ServiceCard
            title='Manage users'
            description='View, manage and add user accounts'
            href={`./${agreement_id}/manage-users`}
            width={cardColumnWidth}
            cypress_id='manage-users-card'
          />
        )}
        {launchVDICard && (
          <ServiceCard
            title='Launch the virtual desktop'
            description='Access the data, tools and service in your agreement'
            href={`./${agreement_id}/switchagreement`}
            width={cardColumnWidth}
          />
        )}
        {uploadRefDataCard && (
          <ServiceCard
            title='Upload reference data'
            description='Bring reference data into the environment'
            href={`./${agreement_id}/fileupload`}
            width={cardColumnWidth}
          />
        )}
        {guidanceCard && (
          <ServiceCard
            title='Get help and guidance (opens in new window)'
            description='Access guidance on setting up your account and getting started with the tools'
            href='https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides'
            width={cardColumnWidth}
            new_window={true}
          />
        )}
      </ul>
    </>
  );
}
