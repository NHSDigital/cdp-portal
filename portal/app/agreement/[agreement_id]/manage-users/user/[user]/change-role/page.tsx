import { Metadata } from "next";
import ChangeUserRoleForm from "./changeUserRoleForm";
import changeUserRole from "./serverActions";

export const metadata: Metadata = {
  title: "Change user role",
};

interface ChangeRolePageProps {
  params: { agreement_id: string; user: string };
}

export default async function ChangeRolePage({ params }: ChangeRolePageProps) {
  const { agreement_id, user } = params;

  const user_email_decoded = decodeURIComponent(user);

  return (
    <div className="nhsuk-grid-row">
      <div className="nhsuk-grid-column-three-quarters">
        <>
          <ChangeUserRoleForm
            changeUserRole={changeUserRole.bind(null, {
              agreement_id,
              user_to_change_email: user_email_decoded,
            })}
          />
        </>
      </div>
    </div>
  );
}
