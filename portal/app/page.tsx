import React from "react";
import { Metadata } from "next";
import getUserAgreements from "services/getUserAgreements";
import { getLoggerAndSession } from "./shared/logging";
import { redirect } from "next/navigation";
import hasPermissions from "./services/hasPermissions";
import { Actions } from "types/enums";
import hasFeatureFlagEnabled from "app/services/hasFeatureFlagEnabled";
import { INDUCTION_FEATURE_FLAG } from "./induction/consts";
import getAllAgreements from "services/getAllAgreements";
import SelectAgreementPageClient from "./pageClient";

export const metadata: Metadata = {
  title: "Home - Select Agreement - NHS Secure Data Environment",
};

export default async function SelectAgreementPage() {
  const { logger, session } = await getLoggerAndSession("SelectAgreementsPage");
  logger.info({
    message: `User has successfully signed in.`,
  });

  const inductionFeatureFlagEnabled = await hasFeatureFlagEnabled({
    featureFlagName: INDUCTION_FEATURE_FLAG,
  });

  const { activeAgreements, inductionNeeded, inductionPassed } =
    await getUserAgreements(session.user.email);

  if (inductionFeatureFlagEnabled && inductionNeeded && !inductionPassed) {
    redirect("/induction");
  }

  const userHasSeeAllAgreementsPermission = await hasPermissions({
    permissions_required: [Actions.SEE_ALL_AGREEMENTS],
    user_email: session.user.email,
  });

  const all_agreements = await getAllAgreements();
  const merge_all_agreements_with_active_agreements = all_agreements.concat(
    activeAgreements.filter(
      (active) =>
        !all_agreements.some((all) => all.agreement_id === active.agreement_id)
    )
  );

  const agreements_to_display = userHasSeeAllAgreementsPermission
    ? merge_all_agreements_with_active_agreements
    : activeAgreements;

  if (agreements_to_display.length == 1) {
    redirect(`/agreement/${agreements_to_display[0].agreement_id}`);
  }

  return (
    <>
      <SelectAgreementPageClient
        agreements_to_display={agreements_to_display}
      />
    </>
  );
}
