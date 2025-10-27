import React from 'react';

import ConfirmationCheckbox from '@/app/agreement/[agreement_id]/manage-users/add-user/confirm/_components/confirmationCheckbox';
import { WhiteLabelKey } from '@/config/whiteLabel';

import { UserToAdd } from './types';

const confirmationLabelMap: Record<WhiteLabelKey, string> = {
  SDE: 'I accept the above costs and confirm that the details I have provided are correct.',
  CDP: 'I confirm the details I have provided are correct.',
};

export interface AcceptAndConfirmFormProps {
  cookieAddedUser: UserToAdd;
  submitUsers: (e) => void;
  createOneUserNoJSFormAction: (form_data: FormData) => void;
  error: string;
  whiteLabelKey: WhiteLabelKey;
}

export default function AcceptAndConfirmForm({
  cookieAddedUser,
  submitUsers,
  createOneUserNoJSFormAction,
  error,
  whiteLabelKey,
}: AcceptAndConfirmFormProps) {
  if (!(whiteLabelKey in confirmationLabelMap)) {
    throw new Error(`confirmationLabelMap entry missing: ${whiteLabelKey}`);
  }

  return (
    <form
      action={createOneUserNoJSFormAction}
      onSubmit={(e) => {
        e.preventDefault();

        submitUsers(e);
      }}
    >
      <input type='hidden' name='email' value={cookieAddedUser.email} />
      <input
        type='hidden'
        name='first_name'
        value={cookieAddedUser.first_name}
      />
      <input type='hidden' name='last_name' value={cookieAddedUser.last_name} />
      <input type='hidden' name='role' value={cookieAddedUser.role} />
      <div>
        <ConfirmationCheckbox
          errors={error ? [error] : undefined}
          label={confirmationLabelMap[whiteLabelKey]}
          name='final_confirm'
        />
        <div className='nhsuk-u-padding-bottom-9'></div>
        <p>
          <button data-cy='confirm-users-button' className='nhsuk-button'>
            Confirm users
          </button>
        </p>
      </div>
    </form>
  );
}
