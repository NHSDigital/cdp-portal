import styles from "./user-details.module.css";
import Link from "next/link";
import { StatusTag } from "app/shared/statusTags";
import {
  getFormattedTimestamp,
  getFormattedRole,
  getFormattedFleetType,
  NO_TIMESTAMP_TEXT,
} from "app/shared/common";
import { getLogger } from "helpers/logging/logger";
import { User } from "app/services/getUsersInAgreement";

const logger = getLogger("userDetailsPage");

interface UserDescriptionListProps {
  agreement_id: string;
  user: string;
  user_details: User;
}

export default async function UserDescriptionList({
  agreement_id,
  user,
  user_details,
}: UserDescriptionListProps) {
  const user_is_active =
    user_details.enabled_agreement && user_details.enabled_global;

  const user_added_to_dsa = user_details.creation_timestamp_agreement
    ? user_details.creation_timestamp_agreement
    : user_details.creation_timestamp_global;

  return (
    <dl
      className={"nhsuk-summary-list " + styles.summary_list}
      key={"user_details"}
    >
      <SummaryRow
        item_key="Status"
        item_value={<StatusTag status={user_details.calculated_status} />}
        item_action={
          <ChangeActivationStatusLink
            status={user_details.calculated_status}
            agreement_id={agreement_id}
            user={user_details.email}
          />
        }
        key="status"
        data_cy="status"
      />
      <SummaryRow
        item_key="Email address"
        item_value={user_details.email}
        data_cy="email"
      />
      <SummaryRow
        item_key="Role"
        item_value={getFormattedRole(user_details.application_roles_agreement)}
        item_action={
          user_is_active ? (
            <ChangeRoleLink
              agreement_id={agreement_id}
              user={user_details.email}
            />
          ) : null
        }
        key="role"
        data_cy="role"
      />
      {user_details.application_roles_agreement?.includes("Analyst") && (
        <SummaryRow
          item_key="VDI memory size"
          item_value={getFormattedFleetType(user_details.fleet_type)}
          key="vdi_memory_size"
          data_cy="vdi_memory_size"
        />
      )}
      <SummaryRow
        item_key="Added to agreement"
        item_value={getFormattedTimestamp(user_added_to_dsa)}
        key="added_to_dsa"
        data_cy="added_to_dsa"
      />
      {/* // TODO: add this row in when the induction flow is added */}
      {user_details.application_roles_agreement?.includes("Analyst") &&
        user_details.induction.passed && (
          <SummaryRow
            data_cy="induction_passed"
            item_key="Induction assessment passed"
            item_value={getFormattedTimestamp(
              user_details.induction.passed_timestamp
            )}
            key="induction_assessment_passed"
          />
        )}
      {user_details.calculated_status == "Activated" &&
        user_details.reactivated_timestamp_agreement && (
          <SummaryRow
            item_key="Reactivated"
            item_value={getFormattedTimestamp(
              user_details.reactivated_timestamp_agreement
            )}
            key="reactivated"
            data_cy="reactivated"
          />
        )}
      {user_details.calculated_status == "Deactivated" &&
        user_details.disabled_timestamp_agreement && (
          <SummaryRow
            item_key="Deactivated"
            item_value={getFormattedTimestamp(
              user_details.disabled_timestamp_agreement
            )}
            key="deactivated"
            data_cy="deactivated"
          />
        )}
      {user_details.application_roles_agreement?.includes("Analyst") && (
        <SummaryRow
          item_key="Last logged in"
          item_value={getFormattedTimestamp(user_details.last_login)}
          item_value_hidden_text={
            getFormattedTimestamp(user_details.last_login) == NO_TIMESTAMP_TEXT
              ? "Never logged in"
              : undefined
          }
          key="last_logged_in"
          data_cy="last_logged_in"
        />
      )}
    </dl>
  );
}

interface SummaryRowProps {
  item_key: string;
  item_value?: any;
  item_value_hidden_text?: string | undefined;
  item_action?: any;
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
    <div className="nhsuk-summary-list__row">
      <dt className={`nhsuk-summary-list__key ` + styles.summary_list_key}>
        {item_key}
      </dt>
      <dd
        className={`nhsuk-summary-list__value ` + styles.summary_list_value}
        data-cy={data_cy}
      >
        {item_value_hidden_text && (
          <span className="nhsuk-u-visually-hidden">
            {item_value_hidden_text}
          </span>
        )}
        {item_value}
      </dd>
      <dd className={`nhsuk-summary-list__actions`}>{item_action}</dd>
    </div>
  );
}

function ChangeActivationStatusLink({
  status,
  agreement_id,
  user,
}: {
  status: string;
  agreement_id: string;
  user: string;
}) {
  const link_contents =
    status === "Activated" || status === "Pending Induction"
      ? "Deactivate user"
      : "Reactivate user";

  return (
    <Link
      href={`/agreement/${agreement_id}/manage-users/user/${user}/confirm-change-activation`}
    >
      {link_contents}
    </Link>
  );
}

function ChangeRoleLink({
  agreement_id,
  user,
}: {
  agreement_id: string;
  user: string;
}) {
  return (
    <Link
      data-cy="change-role-link"
      href={`/agreement/${agreement_id}/manage-users/user/${user}/change-role`}
    >
      Change role
    </Link>
  );
}
