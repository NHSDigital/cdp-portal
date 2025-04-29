import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { INDUCTION_FEATURE_FLAG } from '@/app/induction/consts';
import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import getAllAgreements from '@/services/getAllAgreements';
import getUserAgreements from '@/services/getUserAgreements';

import SwitchAgreementManager from './_components.tsx/SwitchAgreementContent';

interface SwitchAgreementPageProps {
  params: { agreement_id: string };
}

export default async function SwitchAgreementPage({
  params: { agreement_id },
}: SwitchAgreementPageProps) {
  const session = await getServerSession();
  const inductionEnabled = await hasFeatureFlagEnabled({
    featureFlagName: INDUCTION_FEATURE_FLAG,
  });

  const userAgreements = await getUserAgreements(session?.user?.email || '');
  const agreement_count = Object.keys(userAgreements.activeAgreements).length;

  if (
    inductionEnabled &&
    userAgreements.inductionNeeded &&
    !userAgreements.inductionPassed
  ) {
    redirect('/induction');
  }

  const all_agreements = await getAllAgreements();
  const current_agreement = all_agreements.find(
    (agreement) => agreement.agreement_id == agreement_id,
  );
  const appstream_desktop_client_enabled =
    current_agreement?.appstream_desktop_client_enabled || false;

  return (
    <SwitchAgreementManager
      agreement_id={agreement_id}
      agreement_count={agreement_count}
      appstream_desktop_client_enabled={appstream_desktop_client_enabled}
    />
  );
}
