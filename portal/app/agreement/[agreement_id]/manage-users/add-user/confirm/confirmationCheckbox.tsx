import React from "react";

interface ConfirmationCheckboxProps {
  errors?: string[];
  label: React.ReactNode;
  name: string;
}

export default function ConfirmationCheckbox({
  errors,
  label,
  name,
}: ConfirmationCheckboxProps) {
  const checkbox_unique_id = name;
  const checkbox_input_id = checkbox_unique_id + "-input";
  const checkbox_label_id = checkbox_unique_id + "-label";

  const errors_to_display: JSX.Element[] = [];
  const error_ids: string[] = [];

  errors?.forEach((error, index) => {
    const error_id = `${checkbox_unique_id}-error-${index}`;
    error_ids.push(error_id);
    errors_to_display.push(
      <span className="nhsuk-error-message" key={error_id} id={error_id}>
        <span className="nhsuk-u-visually-hidden">Error:</span>
        {error}
      </span>
    );
  });

  return (
    <div
      className={
        errors ? "nhsuk-form-group nhsuk-form-group--error" : "nhsuk-form-group"
      }
    >
      <>{errors_to_display}</>
      <div className="nhsuk-checkboxes">
        <div className="nhsuk-checkboxes__item">
          <input
            className="nhsuk-checkboxes__input"
            id={checkbox_input_id}
            name={name}
            type="checkbox"
            aria-labelledby={checkbox_label_id}
            aria-describedby={errors ? error_ids.join(" ") : undefined}
          />
          <label
            className="nhsuk-label nhsuk-checkboxes__label"
            id={checkbox_label_id}
            htmlFor={checkbox_input_id}
          >
            {label}
          </label>
        </div>
      </div>
    </div>
  );
}
