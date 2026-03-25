import { Metadata } from 'next';

import { getWhiteLabelValues } from '@/config/whiteLabel';

import ChangeUserRoleForm from './_components/changeUserRoleForm';
import changeUserRole from './_components/serverActions';

export async function generateMetadata(): Promise<Metadata> {
  const whiteLabelValues = getWhiteLabelValues();
  return {
    title: `Change user role - ${whiteLabelValues.acronym}`,
  };
}

interface ChangeRolePageProps {
  params: Promise<{ agreement_id: string; user: string }>;
}

export default async function ChangeRolePage({ params }: ChangeRolePageProps) {
  const { agreement_id, user } = await params;
  const user_email_decoded = decodeURIComponent(user);

  const whiteLabelValues = getWhiteLabelValues();

  return (
    <div className='nhsuk-grid-row'>
      <div className='nhsuk-grid-column-three-quarters'>
        <>
          <ChangeUserRoleForm
            changeUserRole={changeUserRole.bind(null, {
              agreement_id,
              user_to_change_email: user_email_decoded,
            })}
            whiteLabelValues={whiteLabelValues}
          />
        </>
      </div>
    </div>
  );
}
