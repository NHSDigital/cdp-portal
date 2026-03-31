import React from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

const dataAnalystDescriptionMap: Record<WhiteLabelKey, React.JSX.Element> = {
  SDE: (
    <p>
      New Data Analysts will be sent an email to an online induction and
      assessment. Once they have passed this induction, these users will be
      activated and charged for.
    </p>
  ),
  CDP: (
    <p>
      New Data Analysts will be activated and sent an email to set up their
      account.
    </p>
  ),
};

interface DataAnalystDescriptionProps {
  whiteLabelKey: WhiteLabelKey;
}

export function DataAnalystDescription({
  whiteLabelKey,
}: DataAnalystDescriptionProps) {
  if (!(whiteLabelKey in dataAnalystDescriptionMap)) {
    throw new Error(
      `dataAnalystDescriptionMap entry is missing: ${whiteLabelKey}`,
    );
  }

  return dataAnalystDescriptionMap[whiteLabelKey];
}
