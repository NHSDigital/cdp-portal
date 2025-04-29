'use client';

import { useEffect } from 'react';

import ConfirmView from './confirmView';
import LoadingView from './loadingView';
import { UserToAdd } from './types';
import useSubmitUsers from './useSubmitUsers';
import useUserListFromSessionStorage from './useUserListFromSessionStorage';

interface ConfirmClientProps {
  latest_user_to_add: UserToAdd;
  form_id: string;
  agreement_id: string;
  createOneUserNoJS: (
    previous_state: Record<string, unknown>,
    form_data: FormData,
  ) => void;
}

export default function ConfirmClient({
  latest_user_to_add,
  form_id,
  agreement_id,
  createOneUserNoJS,
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

  if (isSubmitting && progress) return <LoadingView progress={progress} />;

  return (
    <ConfirmView
      {...{
        users_to_display,
        agreement_id,
        form_id,
        latest_user_to_add,
        submitUsers,
        createOneUserNoJS,
        error,
      }}
    />
  );
}
