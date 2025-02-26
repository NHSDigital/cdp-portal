import { Metadata } from "next";
import { getLogger } from "helpers/logging/logger";
import getAgreementUserDetails from "app/services/getAgreementUserDetails";
import ConfirmChangeActivationPage from "./confirmChangeActivationPage";
import changeActivation from "./serverActions";

const logger = getLogger("confirmChangeActivationStatus");

export const metadata: Metadata = {
  title: "Confirm change activation",
};

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
    user_email_decoded
  );

  const users_full_name = `${user_details.first_name} ${user_details.last_name}`;

  const user_is_active =
    user_details.enabled_agreement && user_details.enabled_global;

  return (
    <div className="nhsuk-grid-row">
      <div className="nhsuk-grid-column-three-quarters">
        <ConfirmChangeActivationPage
          users_full_name={users_full_name}
          users_is_active={user_is_active}
          changeActivation={changeActivation.bind(null, {
            agreement_id,
            user_to_change_activation_email: user_email_decoded,
            new_activation: !user_is_active,
          })}
        />
      </div>
    </div>
  );
}
