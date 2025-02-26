export default function GetHelpWithThisQuestion({
  help_text,
  help_label,
  help_link,
}: {
  help_text?: string;
  help_label: string;
  help_link: string;
}) {
  return (
    <details className="nhsuk-details">
      <summary className="nhsuk-details__summary">
        <span className="nhsuk-details__summary-text">
          Get help with this question
        </span>
      </summary>
      <div className="nhsuk-details__text">
        <p>
          If you&apos;re not sure of the answer, {help_text}{" "}
          <a href={help_link} target="_blank">
            {help_label}
          </a>
        </p>
      </div>
    </details>
  );
}
