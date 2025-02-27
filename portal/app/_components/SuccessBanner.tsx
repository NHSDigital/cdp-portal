import styles from "./styles.module.css";

export default function SuccessBanner({
  successMessage,
}: {
  successMessage: string;
}) {
  return (
    <div className="nhsuk-u-width-full" role="alert">
      <p className={`${styles.alert_panel_green} nhsuk-u-width-full`}>
        <svg
          className="nhsuk-icon nhsuk-icon__tick"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          width="34"
          height="34"
        >
          <path
            strokeWidth="4"
            strokeLinecap="round"
            d="M18.4 7.8l-8.5 8.4L5.6 12"
            stroke="#007f3b"
          ></path>
        </svg>
        <span className="nhsuk-u-visually-hidden">Success -</span>
        <span data-cy="success-message">{successMessage}</span>
      </p>
    </div>
  );
}
