export function StatusTag({ status }: { status: string }) {
  switch (status) {
    case "Activated":
      return <ActivatedTag />;
    case "Deactivated":
      return <DeactivatedTag />;
    case "Pending Induction":
      return <PendingInductionTag />;
    default:
      return null;
  }
}
export function ActivatedTag() {
  return <strong className="nhsuk-tag nhsuk-tag--aqua-green">ACTIVATED</strong>;
}

export function DeactivatedTag() {
  return <strong className="nhsuk-tag nhsuk-tag--red">DEACTIVATED</strong>;
}

export function PendingInductionTag() {
  return (
    <strong className="nhsuk-tag nhsuk-tag--blue">
      PENDING&nbsp;INDUCTION
    </strong>
  );
}

export function WhatDoTheseStatusesMean() {
  return (
    <details className="nhsuk-details">
      <summary className="nhsuk-details__summary">
        <span className="nhsuk-details__summary-text" data-cy="status_key">
          What do these statuses mean?
        </span>
      </summary>
      <span className="nhsuk-u-visually-hidden">Expand to see</span>
      <div className="nhsuk-details__text">
        <table className="nhsuk-table" data-cy="status_key_table">
          <caption className="nhsuk-table__caption" hidden>
            What do these statuses mean table
          </caption>
          <thead role="rowgroup" className="nhsuk-table__head">
            <tr role="row">
              <th role="columnheader" scope="col">
                Status
              </th>
              <th role="columnheader" scope="col">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="nhsuk-table__body">
            <tr role="row" className="nhsuk-table__row">
              <td className="nhsuk-table__cell">
                <PendingInductionTag />
              </td>
              <td className="nhsuk-table__cell ">
                User has been sent induction assessment invite email but has not
                yet passed the assessment.
              </td>
            </tr>
            <tr role="row" className="nhsuk-table__row">
              <td className="nhsuk-table__cell">
                <ActivatedTag />
              </td>
              <td className="nhsuk-table__cell ">
                User has access to the SDE.
              </td>
            </tr>
            <tr role="row" className="nhsuk-table__row">
              <td className="nhsuk-table__cell">
                <DeactivatedTag />
              </td>
              <td className="nhsuk-table__cell ">
                User account is temporarily closed but can be reactivated at any
                time.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
