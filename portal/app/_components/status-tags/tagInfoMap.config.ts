import { WhiteLabelKey } from '@/config/whiteLabel';

export type Tags = 'Activated' | 'Deactivated' | 'Pending Induction';

export type TagInfoConfig = {
  id: string;
  description: string;
  show?: (flags: { whiteLabelKey: WhiteLabelKey }) => boolean;
};

export const tagInfoConfigMap: Record<Tags, TagInfoConfig> = {
  Activated: {
    id: 'activated',
    description: 'User has access to the SDE.',
  },
  Deactivated: {
    id: 'deactivated',
    description:
      'User account is temporarily closed but can be reactivated at any time.',
  },
  'Pending Induction': {
    id: 'pending-induction',
    description:
      'User has been sent induction assessment invite email but has not yet passed the assessment.',
    show: ({ whiteLabelKey }) => {
      if (whiteLabelKey == 'SDE') return true;
      if (whiteLabelKey == 'CDP') return false;
      throw new Error(`tagInfoMap entry missing: ${whiteLabelKey}`);
    },
  },
};
