import React from 'react';

import { TagInfoConfig, tagInfoConfigMap, Tags } from './tagInfoMap.config';

export type TagInfo = TagInfoConfig & {
  element: React.JSX.Element;
};

export const tagInfoMap: Record<Tags, TagInfo> = {
  Activated: {
    ...tagInfoConfigMap.Activated,
    element: <ActivatedTag />,
  },
  Deactivated: {
    ...tagInfoConfigMap.Deactivated,
    element: <DeactivatedTag />,
  },
  'Pending Induction': {
    ...tagInfoConfigMap['Pending Induction'],
    element: <PendingInductionTag />,
  },
};

function ActivatedTag() {
  return <strong className='nhsuk-tag nhsuk-tag--aqua-green'>ACTIVATED</strong>;
}

function DeactivatedTag() {
  return <strong className='nhsuk-tag nhsuk-tag--red'>DEACTIVATED</strong>;
}

function PendingInductionTag() {
  return (
    <strong className='nhsuk-tag nhsuk-tag--blue'>
      PENDING&nbsp;INDUCTION
    </strong>
  );
}
