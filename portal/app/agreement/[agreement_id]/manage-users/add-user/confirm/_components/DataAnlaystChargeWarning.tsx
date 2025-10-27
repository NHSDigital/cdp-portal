import React from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

const displayDataAnalystChargeWarningMap: Record<WhiteLabelKey, boolean> = {
  SDE: true,
  CDP: false,
};

interface DataAnalystChargeWarningProps {
  whiteLabelKey: WhiteLabelKey;
}

export function DataAnalystChargeWarning({
  whiteLabelKey,
}: DataAnalystChargeWarningProps) {
  if (!(whiteLabelKey in displayDataAnalystChargeWarningMap)) {
    throw new Error(
      `displayDataAnalystChargeWarningMap entry missing: ${whiteLabelKey}`,
    );
  }

  if (!displayDataAnalystChargeWarningMap[whiteLabelKey]) {
    return undefined;
  }

  return (
    <div data-cy='data-analyst-warning' className='nhsuk-warning-callout'>
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
