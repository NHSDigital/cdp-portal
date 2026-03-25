export const ROLE_KEYS = {
  ANALYST: 'Analyst',
  USER_MANAGER: 'UserManager',
  BOTH: 'Both',
} as const;

export type RoleInfoKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

export type RoleInfoConfig = {
  longName: string;
  label: string;
  buttonValue: string;
  id: string;
};

export const roleConfigMap: Record<RoleInfoKey, RoleInfoConfig> = {
  Analyst: {
    longName: 'Data Analyst',
    label: 'Data Analyst',
    buttonValue: 'Analyst',
    id: 'analyst',
  },
  UserManager: {
    longName: 'User Manager',
    label: 'User Manager',
    buttonValue: 'UserManager',
    id: 'user-manager',
  },
  Both: {
    longName: 'Both (Data Analyst and User Manager)',
    label: 'Both',
    buttonValue: 'Both',
    id: 'both',
  },
};
