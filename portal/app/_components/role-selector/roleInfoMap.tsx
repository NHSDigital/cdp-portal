import React from 'react';

import { WhiteLabelKey } from '@/config/whiteLabel';

import {
  roleConfigMap,
  RoleInfoConfig,
  RoleInfoKey,
} from './roleInfoMap.config';

export type RoleInfo = RoleInfoConfig & {
  description: (key: WhiteLabelKey) => React.JSX.Element;
};

export const roleInfoMap: Record<RoleInfoKey, RoleInfo> = {
  Analyst: {
    ...roleConfigMap.Analyst,
    description: (whiteLabelKey: WhiteLabelKey) =>
      analystDescriptionMap[whiteLabelKey],
  },
  UserManager: {
    ...roleConfigMap.UserManager,
    description: (whiteLabelKey: WhiteLabelKey) =>
      userManagerDescriptionMap[whiteLabelKey],
  },
  Both: {
    ...roleConfigMap.Both,
    description: (whiteLabelKey: WhiteLabelKey) =>
      bothDescriptionMap[whiteLabelKey],
  },
};

export const analystDescriptionMap: Record<WhiteLabelKey, React.JSX.Element> = {
  SDE: (
    <p>
      User can access data through the SDE platform. These users will be charged{' '}
      <strong>£435 a month</strong> per agreement.
    </p>
  ),
  CDP: <p>User can access data through the CDP platform.</p>,
};

export const userManagerDescriptionMap: Record<
  WhiteLabelKey,
  React.JSX.Element
> = {
  SDE: (
    <p>
      User can add and manage other users on the SDE platform. User managers are{' '}
      <strong>not charged.</strong>
    </p>
  ),
  CDP: <p>User can add and manage other users on the CDP platform.</p>,
};

export const bothDescriptionMap: Record<WhiteLabelKey, React.JSX.Element> = {
  SDE: (
    <p>
      User can access data and manage other users on the SDE platform. These
      users will be charged <strong>£435 a month</strong> per agreement.
    </p>
  ),
  CDP: <p>User can access data and manage other users on the CDP platform.</p>,
};
