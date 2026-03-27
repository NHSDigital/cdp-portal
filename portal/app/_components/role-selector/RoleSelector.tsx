import { RadioButtonInputField } from 'app/shared/formFields';
import React from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

import {
  analystDescriptionMap,
  bothDescriptionMap,
  RoleInfo,
  roleInfoMap,
  userManagerDescriptionMap,
} from './roleInfoMap';
import { RoleInfoKey } from './roleInfoMap.config';

interface RoleSelectorProps {
  errors?: string[];
  whiteLabelKey: WhiteLabelKey;
}

export default function RoleSelector({
  errors,
  whiteLabelKey,
}: RoleSelectorProps) {
  if (!(whiteLabelKey in analystDescriptionMap)) {
    throw new Error(`analystDescriptionMap entry missing: ${whiteLabelKey}`);
  }
  if (!(whiteLabelKey in userManagerDescriptionMap)) {
    throw new Error(
      `userManagerDescriptionMap entry missing: ${whiteLabelKey}`,
    );
  }
  if (!(whiteLabelKey in bothDescriptionMap)) {
    throw new Error(`bothDescriptionMap entry missing: ${whiteLabelKey}`);
  }

  const errors_to_display: JSX.Element[] = [];
  const error_ids: string[] = [];

  errors?.forEach((error, index) => {
    const error_id = `role-error-${index}`;
    error_ids.push(error_id);
    errors_to_display.push(
      <span className='nhsuk-error-message' key={error_id} id={error_id}>
        <span className='nhsuk-u-visually-hidden'>Error:</span>
        {error}
      </span>,
    );
  });

  return (
    <>
      <div className='nhsuk-radios'>
        {errors_to_display}

        {(Object.entries(roleInfoMap) as [RoleInfoKey, RoleInfo][]).map(
          ([roleKey, { label, buttonValue, description }]) => (
            <RadioButtonInputField
              key={roleKey}
              label={label}
              button_group='role'
              button_value={buttonValue}
              description={description(whiteLabelKey)}
              error_ids={error_ids}
            />
          ),
        )}
      </div>
    </>
  );
}
