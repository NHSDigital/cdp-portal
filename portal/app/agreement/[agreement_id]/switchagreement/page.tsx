import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import hasFeatureFlagEnabled from '@/app/services/hasFeatureFlagEnabled';
import { getInductionRedirectTarget } from '@/app/shared/inductionHelpers';
import { FeatureFlags } from '@/config/constants';
import { getWhiteLabelValues } from '@/config/whiteLabel';
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
  const inductionFeatureFlagEnabled = await hasFeatureFlagEnabled({
    featureFlagName: FeatureFlags.INDUCTION,
  });

  const { activeAgreements, inductionNeeded, inductionPassed } =
    await getUserAgreements(session?.user?.email || '');

  const agreement_count = Object.keys(activeAgreements).length;

  const inductionRedirectTarget = getInductionRedirectTarget({
    inductionFeatureFlagEnabled,
    inductionNeeded,
    inductionPassed,
  });

  if (inductionRedirectTarget) {
    redirect(inductionRedirectTarget);
  }

  const all_agreements = await getAllAgreements();
  const current_agreement = all_agreements.find(
    (agreement) => agreement.agreement_id == agreement_id,
  );
  const appstream_desktop_client_enabled =
    current_agreement?.appstream_desktop_client_enabled || false;

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <SwitchAgreementManager
      agreement_id={agreement_id}
      agreement_count={agreement_count}
      appstream_desktop_client_enabled={appstream_desktop_client_enabled}
      whiteLabelValues={whiteLabelValues}
    />
  );
}
