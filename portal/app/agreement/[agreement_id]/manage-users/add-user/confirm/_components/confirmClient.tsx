'use client';

import BackLink from 'app/shared/backLink';
import ErrorSummary from 'app/shared/errorSummary';
import { useEffect } from 'react';
import React from 'react';
import { useFormState } from 'react-dom';

import useSubmitUsers from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useSubmitUsers';
import useUserListFromSessionStorage from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/useUserListFromSessionStorage';
import { WhiteLabelEntry } from '@/config/whiteLabel';

import AcceptAndConfirmForm from './acceptAndConfirmForm';
import AddAnotherUserLink from './addAnotherUserLink';
import { DataAnalystDescription } from './DataAnalystDescription';
import { DataAnalystChargeWarning } from './DataAnlaystChargeWarning';
import LoadingView from './loadingView';
import { UserToAdd } from './types';
import UserDetailsTable from './userDetailsTable';

const initial_state = {};

export interface ConfirmClientProps {
  latest_user_to_add: UserToAdd;
  form_id: string;
  agreement_id: string;
  createOneUserNoJS: (
    previous_state: Record<string, unknown>,
    form_data: FormData,
  ) => void;
  whiteLabelValues: WhiteLabelEntry;
}

export default function ConfirmClient({
  latest_user_to_add,
  form_id,
  agreement_id,
  createOneUserNoJS,
  whiteLabelValues,
}: ConfirmClientProps) {
  const users_to_display = useUserListFromSessionStorage({
    latest_user_to_add,
    agreement_id,
    form_id,
  });

  const { isSubmitting, submitUsers, progress, error } = useSubmitUsers({
    users_to_display,
    agreement_id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [state, createOneUserNoJSFormAction] = useFormState(
    createOneUserNoJS,
    initial_state,
  );
  const combined_error = error || state.error;

  if (isSubmitting && progress) return <LoadingView progress={progress} />;

  return (
    <>
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
      <DataAnalystDescription whiteLabelKey={whiteLabelValues.acronym} />
      <p>New User Managers will be sent an email to set up their account.</p>
      <DataAnalystChargeWarning whiteLabelKey={whiteLabelValues.acronym} />
      <AcceptAndConfirmForm
        cookieAddedUser={latest_user_to_add}
        submitUsers={submitUsers}
        createOneUserNoJSFormAction={createOneUserNoJSFormAction}
        error={combined_error}
        whiteLabelKey={whiteLabelValues.acronym}
      />
    </>
  );
}
