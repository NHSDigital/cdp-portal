import React from "react";
import BackLink from "app/shared/backLink";
import hasFeatureFlagEnabled from "app/services/hasFeatureFlagEnabled";
import { USER_MANAGEMENT_FEATURE_FLAG } from "./manage-users/consts";
import { ServiceCard } from "./ServiceCard";
import { getServerSession } from "next-auth";
import getUserAgreements from "services/getUserAgreements";
import { redirect } from "next/navigation";
import { INDUCTION_FEATURE_FLAG } from "app/induction/consts";
import hasPermissions from "app/services/hasPermissions";

interface IAgreementProps {
  params: { agreement_id: string };
}

export default async function Agreement({
  params: { agreement_id },
}: IAgreementProps) {
  const inductionEnabled = await hasFeatureFlagEnabled({
    featureFlagName: INDUCTION_FEATURE_FLAG,
  });
  const session = await getServerSession();
  const userAgreements = await getUserAgreements(session?.user?.email || "");
  const user_email: string = session!.user!.email!;

  if (
    inductionEnabled &&
    userAgreements.inductionNeeded &&
    !userAgreements.inductionPassed
  ) {
    redirect("/induction");
  }

  const manageUsersEnabled = await hasFeatureFlagEnabled({
    featureFlagName: USER_MANAGEMENT_FEATURE_FLAG,
  });

  const [
    hasOpenAgreementPermission,
    hasUploadFilePermission,
    hasManageUsersPermission,
  ] = await Promise.all(
    [
      "vdi.open_agreement",
      "data_in.upload_file",
      "user_management.get_agreement_users",
    ].map((permission) =>
      hasPermissions({
        permissions_required: [permission],
        agreement_id,
        user_email,
      })
    )
  );

  const hasMultipleAgreements = userAgreements.activeAgreements.length > 1;

  // Define byod_required variable
  const byod_required = !["review_file", "digitrials-fss"].includes(
    agreement_id
  );

  const manageUsersCard = manageUsersEnabled && hasManageUsersPermission;
  const launchVDICard = hasOpenAgreementPermission;
  const uploadRefDataCard = hasUploadFilePermission && byod_required;
  const guidanceCard = byod_required;

  const totalCards = [
    manageUsersCard,
    launchVDICard,
    uploadRefDataCard,
    guidanceCard,
  ].filter(Boolean).length;

  let cardColumnWidth: string;

  switch (totalCards) {
    case 1:
      cardColumnWidth = "nhsuk-grid-column-two-thirds";
      break;
    case 2:
      cardColumnWidth = "nhsuk-grid-column-one-half";
      break;
    case 3:
      cardColumnWidth = "nhsuk-grid-column-one-third";
      break;
    case 4:
      cardColumnWidth = "nhsuk-grid-column-one-half";
      break;
    default:
      cardColumnWidth = "nhsuk-grid-column-one-third";
      break;
  }

  return (
    <>
      {hasMultipleAgreements && <BackLink href="/" />}
      <h1>Secure Data Environment (SDE) Portal</h1>
      <p>Access your online services for {agreement_id}</p>
      <ul className="nhsuk-grid-row nhsuk-card-group">
        {manageUsersCard && (
          <ServiceCard
            title="Manage users"
            description="View, manage and add user accounts"
            href={`./${agreement_id}/manage-users`}
            width={cardColumnWidth}
          />
        )}
        {launchVDICard && (
          <ServiceCard
            title="Launch the virtual desktop"
            description="Access the data, tools and service in your agreement"
            href={`./${agreement_id}/switchagreement`}
            width={cardColumnWidth}
          />
        )}
        {uploadRefDataCard && (
          <ServiceCard
            title="Upload reference data"
            description="Bring reference data into the environment"
            href={`./${agreement_id}/fileupload`}
            width={cardColumnWidth}
          />
        )}
        {guidanceCard && (
          <ServiceCard
            title="Get help and guidance (opens in new window)"
            description="Access guidance on setting up your account and getting started with the tools"
            href="https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides"
            width={cardColumnWidth}
            new_window={true}
          />
        )}
      </ul>
    </>
  );
}
