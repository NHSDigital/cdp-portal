"use client";

import { useParams, usePathname } from "next/navigation";
import styles from "./layout.module.css";
import Link from "next/link";

export default function Navbar() {
  const { agreement_id } = useParams<{ agreement_id?: string }>() || {};
  const current_path = usePathname();

  if (agreement_id == null) {
    return null;
  }

  if (!current_path?.includes(`/agreement/${agreement_id}/manage-users`)) {
    return null;
  }

  const show_change_agreement_link =
    current_path == `/agreement/${agreement_id}/manage-users`;

  return (
    <>
      {/* Main navbar */}
      <PageSelectorBar agreement_id={agreement_id} />
      {/* Change agreement navbar */}
      <ChangeAgreementBar
        agreement_id={agreement_id}
        show_change_agreement_link={show_change_agreement_link}
      />
    </>
  );
}

function PageSelectorBar({ agreement_id }: { agreement_id: string }) {
  return (
    <div className="nhsuk-width-container">
      <nav
        className="nhsuk-navigation"
        id="header-navigation"
        role="navigation"
        aria-label="Primary navigation"
      >
        <ul
          className={`nhsuk-header__navigation-list ${styles.navigationList}`}
        >
          <li
            className={`nhsuk-header__navigation-item ${styles.listItemRightMargin}`}
          >
            <a
              className="nhsuk-header__navigation-link"
              href={`/agreement/${agreement_id}`}
            >
              SDE Portal
            </a>
          </li>
          <li className="nhsuk-header__navigation-item">
            <a
              className="nhsuk-header__navigation-link"
              href={`/agreement/${agreement_id}/manage-users`}
            >
              Manage users
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function ChangeAgreementBar({
  agreement_id,
  show_change_agreement_link,
}: {
  agreement_id: string;
  show_change_agreement_link: boolean;
}) {
  return (
    <nav
      className={`nhsuk-breadcrumb ${styles.changeAgreementBar} nhsuk-body-m nhsuk-u-margin-bottom-0`}
      id="change-agreement-bar"
      role="navigation"
      aria-label="Currently selected agreement"
    >
      <div className="nhsuk-width-container">
        <strong>Reference Number:</strong> {agreement_id.toUpperCase()}
        {show_change_agreement_link && (
          <Link href="/" className={`${styles.linkFloatRight}`}>
            Change agreement
          </Link>
        )}
      </div>
    </nav>
  );
}
