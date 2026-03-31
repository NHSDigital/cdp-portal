import { User } from 'app/services/getUsersInAgreement';
import React from 'react';

import { ROLE_KEYS } from '@/app/_components/role-selector/roleInfoMap.config';
import { StatusTag } from '@/app/_components/status-tags/StatusTags';
import {
  getFormattedFleetType,
  getFormattedRole,
  getFormattedTimestamp,
  NO_TIMESTAMP_TEXT,
} from '@/app/shared/common';
import { WhiteLabelKey } from '@/config/whiteLabel';

import { ChangeActivationStatusLink } from './ChangeActivationStatusLink';
import { ChangeRoleLink } from './ChangeRoleLink';

export type UserDescriptionMapKey =
  | 'Status'
  | 'Email address'
  | 'Role'
  | 'VDI memory size'
  | 'Added to agreement'
  | 'Induction assessment passed'
  | 'Reactivated'
  | 'Deactivated'
  | 'Last logged in';

export type UserDescriptionMapItem = {
  id: string;
  getValue: (user: User) => React.ReactNode;
  getHiddenText?: (user: User) => string | undefined;
  getAction?: (user: User, agreement_id: string) => React.ReactNode;
  show?: (user: User, whiteLabelKey: WhiteLabelKey) => boolean;
};

const never_logged_in = 'Never logged in';

export const userDescriptionMap: Record<
  UserDescriptionMapKey,
  UserDescriptionMapItem
> = {
  Status: {
    id: 'status',
    getValue: (user) => {
      return <StatusTag status={user.calculated_status} />;
    },
    getAction: (user, agreement_id) => {
      return (
        <ChangeActivationStatusLink
          status={user.calculated_status}
          agreement_id={agreement_id}
          user={user.email}
        />
      );
    },
  },

  'Email address': {
    id: 'email',
    getValue: (user) => {
      return user.email;
    },
  },

  Role: {
    id: 'role',
    getValue: (user) => {
      return getFormattedRole(user.application_roles_agreement);
    },
    getAction: (user, agreement_id) => {
      if (!user.enabled_agreement) {
        return null;
      }
      return <ChangeRoleLink user={user.email} agreement_id={agreement_id} />;
    },
  },

  'VDI memory size': {
    id: 'vdi_memory_size',
    getValue: (user) => {
      return getFormattedFleetType(user.fleet_type);
    },
    show: (user) => {
      return (
        user.application_roles_agreement?.includes(ROLE_KEYS.ANALYST) || false
      );
    },
  },

  'Added to agreement': {
    id: 'added_to_dsa',
    getValue: (user) => {
      return getFormattedTimestamp(
        user.creation_timestamp_agreement ?? user.creation_timestamp_global,
      );
    },
  },

  'Induction assessment passed': {
    id: 'induction_assessment_passed',
    getValue: (user) => {
      return getFormattedTimestamp(user.induction.passed_timestamp);
    },
    show: (user, whiteLabelKey) => {
      if (whiteLabelKey == 'SDE') {
        const isAnalyst =
          user.application_roles_agreement?.includes(ROLE_KEYS.ANALYST) ||
          false;
        return isAnalyst && user.induction.passed;
      }
      if (whiteLabelKey == 'CDP') {
        return false;
      }
      throw new Error(
        `show induction assessment passed entry missing: ${whiteLabelKey}`,
      );
    },
  },

  Reactivated: {
    id: 'reactivated',
    getValue: (user) => {
      return getFormattedTimestamp(user.reactivated_timestamp_agreement);
    },
    show: (user) => {
      return (
        user.calculated_status === 'Activated' &&
        !!user.reactivated_timestamp_agreement
      );
    },
  },

  Deactivated: {
    id: 'deactivated',
    getValue: (user) => {
      return getFormattedTimestamp(user.disabled_timestamp_agreement);
    },
    show: (user) => {
      return (
        user.calculated_status === 'Deactivated' &&
        !!user.disabled_timestamp_agreement
      );
    },
  },

  'Last logged in': {
    id: 'last_logged_in',
    getValue: (user) => {
      const last_logged_in = getFormattedTimestamp(user.last_login);
      return last_logged_in != NO_TIMESTAMP_TEXT
        ? last_logged_in
        : never_logged_in;
    },
    getHiddenText: (user) => {
      const hidden_text =
        getFormattedTimestamp(user.last_login) != NO_TIMESTAMP_TEXT
          ? undefined
          : never_logged_in;
      return hidden_text;
    },
    show: (user) => {
      const isAnalyst =
        user.application_roles_agreement?.includes(ROLE_KEYS.ANALYST) || false;
      return isAnalyst;
    },
  },
};
