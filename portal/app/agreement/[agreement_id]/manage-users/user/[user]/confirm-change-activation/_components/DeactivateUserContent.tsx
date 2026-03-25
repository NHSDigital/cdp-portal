import React from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

const deactivateUserContentMap: Record<
  WhiteLabelKey,
  React.JSX.Element | undefined
> = {
  SDE: (
    <p>
      Deactivated users are not charged for. However, if these users have been
      active at any time during an invoiced calendar month, the user will still
      be charged for as standard.
    </p>
  ),
  CDP: undefined,
};

export interface DeactivateUserContentProps {
  usersFullName: string;
  whiteLabelKey: WhiteLabelKey;
}

export function DeactivateUserContent({
  usersFullName,
  whiteLabelKey,
}: DeactivateUserContentProps) {
  if (!(whiteLabelKey in deactivateUserContentMap)) {
    throw new Error(`deactivateUserContentMap entry missing: ${whiteLabelKey}`);
  }
  return (
    <>
      <h1>Deactivate {usersFullName}</h1>
      <p>Deactivated users will receive an email notification.</p>
      {deactivateUserContentMap[whiteLabelKey]}
      <p>You can reactivate a user that has been deactivated at any time.</p>
    </>
  );
}
