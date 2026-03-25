import {
  roleConfigMap,
  RoleInfoConfig,
  RoleInfoKey,
} from '@/app/_components/role-selector/roleInfoMap.config';
import {
  TagInfoConfig,
  tagInfoConfigMap,
  Tags,
} from '@/app/_components/status-tags/tagInfoMap.config';

export type FilterOption = {
  name: string;
  id: string;
  show?: TagInfoConfig['show'];
};

export type Filter = {
  id: string;
  name: string;
  options: FilterOption[];
};

export const CHECKBOX_FILTERS: Filter[] = [
  {
    id: 'role',
    name: 'Roles',
    options: (
      Object.entries(roleConfigMap) as [RoleInfoKey, RoleInfoConfig][]
    ).map(([_, { longName, id }]) => {
      return { name: longName, id };
    }),
  },
  {
    id: 'status',
    name: 'Status',
    options: (Object.entries(tagInfoConfigMap) as [Tags, TagInfoConfig][]).map(
      ([key, { id, show }]) => {
        return { name: key, id, show };
      },
    ),
  },
];
