import React from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

const activateUserContentMap: Record<
  WhiteLabelKey,
  React.JSX.Element | undefined
> = {
  SDE: (
    <p>
      Users are charged the full standard fee for the month. For example, if you
      reactivate a user in June, they will be charged for the whole month of
      June.
    </p>
  ),
  CDP: undefined,
};

interface ActivateUserContentProps {
  usersFullName: string;
  whiteLabelKey: WhiteLabelKey;
}

export function ActivateUserContent({
  usersFullName,
  whiteLabelKey,
}: ActivateUserContentProps) {
  if (!(whiteLabelKey in activateUserContentMap)) {
    throw new Error(`activateUserContentMap entry missing: ${whiteLabelKey}`);
  }

  return (
    <>
      <h1>Reactivate {usersFullName}</h1>
      <p>Reactivated users will receive an email notification.</p>
      {activateUserContentMap[whiteLabelKey]}
    </>
  );
}
