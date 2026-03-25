import { User } from 'app/services/getUsersInAgreement';

import { WhiteLabelKey } from '@/config/whiteLabel';

import styles from './user-details.module.css';
import {
  userDescriptionMap,
  UserDescriptionMapItem,
  UserDescriptionMapKey,
} from './UserDescriptionListConfig';

export interface UserDescriptionListProps {
  agreement_id: string;
  user_details: User;
  whiteLabelKey: WhiteLabelKey;
}

export default function UserDescriptionList({
  agreement_id,
  user_details,
  whiteLabelKey,
}: UserDescriptionListProps) {
  return (
    <dl className={'nhsuk-summary-list ' + styles.summary_list}>
      {(
        Object.entries(userDescriptionMap) as [
          UserDescriptionMapKey,
          UserDescriptionMapItem,
        ][]
      ).map(([key, item]) => {
        const shouldShow = item.show
          ? item.show(user_details, whiteLabelKey)
          : true;

        if (!shouldShow) return null;

        return (
          <SummaryRow
            key={item.id}
            data_cy={item.id}
            item_key={key}
            item_value={item.getValue(user_details)}
            item_value_hidden_text={
              item.getHiddenText ? item.getHiddenText(user_details) : undefined
            }
            item_action={item?.getAction?.(user_details, agreement_id)}
          />
        );
      })}
    </dl>
  );
}

interface SummaryRowProps {
  item_key: string;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  item_value?: any;
  item_value_hidden_text?: string | undefined;
  item_action?: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  data_cy: string;
}

function SummaryRow({
  item_key,
  item_value,
  item_value_hidden_text,
  item_action,
  data_cy,
}: SummaryRowProps) {
  return (
    <div className='nhsuk-summary-list__row'>
      <dt className={`nhsuk-summary-list__key ` + styles.summary_list_key}>
        {item_key}
      </dt>
      <dd
        className={`nhsuk-summary-list__value ` + styles.summary_list_value}
        data-cy={data_cy}
      >
        {item_value_hidden_text && (
          <span className='nhsuk-u-visually-hidden'>
            {item_value_hidden_text}
          </span>
        )}
        {item_value}
      </dd>
      <dd className={`nhsuk-summary-list__actions`}>{item_action}</dd>
    </div>
  );
}
