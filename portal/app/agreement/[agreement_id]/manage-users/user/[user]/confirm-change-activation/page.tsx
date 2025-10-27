import getAgreementUserDetails from 'app/services/getAgreementUserDetails';
import { Metadata } from 'next';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import ConfirmChangeActivationPage from './_components/confirmChangeActivationPage';
import changeActivation from './_components/serverActions';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Confirm change activation - ${whiteLabelValues.acronym}`,
  };
}

interface ManageUsersPageProps {
  params: { agreement_id: string; user: string };
}

export default async function confirmChangeActivationStatus({
  params,
}: ManageUsersPageProps) {
  const { agreement_id, user } = params;

  const user_email_decoded = decodeURIComponent(user);

  const user_details = await getAgreementUserDetails(
    agreement_id,
    user_email_decoded,
  );

  const users_full_name = `${user_details.first_name} ${user_details.last_name}`;

  const user_is_active =
    user_details.enabled_agreement && user_details.enabled_global;

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <div className='nhsuk-grid-row'>
      <div className='nhsuk-grid-column-three-quarters'>
        <ConfirmChangeActivationPage
          usersFullName={users_full_name}
          userIsActive={user_is_active}
          changeActivation={changeActivation.bind(null, {
            agreement_id,
            user_to_change_activation_email: user_email_decoded,
            new_activation: !user_is_active,
          })}
          whiteLabelKey={whiteLabelValues.acronym}
        />
      </div>
    </div>
  );
}
