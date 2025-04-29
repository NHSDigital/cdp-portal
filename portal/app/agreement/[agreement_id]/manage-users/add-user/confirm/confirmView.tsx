import BackLink from 'app/shared/backLink';
import ErrorSummary from 'app/shared/errorSummary';
import { useFormState } from 'react-dom';

import AcceptAndConfirmForm from './acceptAndConfirmForm';
import AddAnotherUserLink from './addAnotherUserLink';
import { UserToAdd } from './types';
import UserDetailsTable from './userDetailsTable';

const initial_state = {};

interface ConfirmViewProps {
  users_to_display: UserToAdd[];
  form_id: string;
  agreement_id: string;
  latest_user_to_add: UserToAdd;
  createOneUserNoJS: (
    previous_state: Record<string, unknown>,
    form_data: FormData,
  ) => void;
  submitUsers: (e) => void;
  error: string | null;
}

export default function ConfirmView({
  users_to_display,
  form_id,
  agreement_id,
  latest_user_to_add,
  createOneUserNoJS,
  submitUsers,
  error,
}: ConfirmViewProps) {
  const [state, createOneUserNoJSFormAction] = useFormState(
    createOneUserNoJS,
    initial_state,
  );
  const combined_error = error || state.error;
  return (
    <div className='nhsuk-grid-row'>
      <div className='nhsuk-grid-column-full'>
        <BackLink
          href={`/agreement/${agreement_id}/manage-users/add-user?form_id=${form_id}&user_id=${latest_user_to_add.user_id}`}
        />
        {combined_error && (
          <ErrorSummary
            errors={[
              {
                input_id: 'confirm-input',
                errors_list: [combined_error],
              },
            ]}
          />
        )}
        <h1>Confirm user details</h1>
        <UserDetailsTable
          users={users_to_display}
          agreement_id={agreement_id}
          form_id={form_id}
        />
        <AddAnotherUserLink form_id={form_id} agreement_id={agreement_id} />
        <p>
          New Data Analysts will be sent an email to an online induction and
          assessment. Once they have passed this induction, these users will be
          activated and charged for.
        </p>
        <p>New User Managers will be sent an email to set up their account.</p>
        <div className='nhsuk-grid-column-two-thirds'>
          <DataAnalystChargeWarning />
          <AcceptAndConfirmForm
            cookieAddedUser={latest_user_to_add}
            submitUsers={submitUsers}
            createOneUserNoJSFormAction={createOneUserNoJSFormAction}
            error={combined_error}
          />
        </div>
      </div>
    </div>
  );
}

function DataAnalystChargeWarning() {
  return (
    <div className='nhsuk-warning-callout'>
      <h2 className='nhsuk-warning-callout__label'>
        <span role='text'>
          <span className='nhsuk-u-visually-hidden'>Important: </span>
          Important
        </span>
      </h2>
      <p>
        Data Analysts are charged <strong>£435 a month</strong> per agreement,
        not including optional tools such as Stata.
      </p>
      <p>
        Data Analysts will be charged in the first month regardless of when they
        are activated.
      </p>
      <p>User Manager accounts are not charged for.</p>
      <p>
        For more information, visit{' '}
        <a
          target='_blank'
          href='https://digital.nhs.uk/services/secure-data-environment-service#charges-to-access-the-sde'
        >
          charges to access the SDE (opens in a new window)
        </a>
        .
      </p>
    </div>
  );
}
