import React from "react";

interface RadioButtonInputFieldProps {
  label: string;
  button_group: string;
  button_value: string;
  description?: any;
  default_checked?: boolean;
  error_ids?: string[];
}

export function RadioButtonInputField({
  label,
  button_group,
  button_value,
  description,
  default_checked,
  error_ids,
}: RadioButtonInputFieldProps) {
  const radio_unique_id = `${button_group}-${button_value.replaceAll(
    " ",
    "-"
  )}`;
  const radio_input_id = radio_unique_id + "-input";
  const radio_label_id = radio_unique_id + "-label";
  const radio_description_id = radio_unique_id + "-description";

  let aria_describedby: string | undefined = undefined;
  if (description && error_ids && error_ids?.length != 0) {
    aria_describedby = `${radio_description_id} ${error_ids.join(" ")}`;
  } else if (description && !error_ids) {
    aria_describedby = radio_description_id;
  } else if (!description && error_ids) {
    aria_describedby = error_ids.join(" ");
  }

  return (
    <div className="nhsuk-radios__item">
      <input
        className="nhsuk-radios__input"
        id={radio_input_id}
        type="radio"
        name={button_group}
        value={button_value}
        aria-labelledby={radio_label_id}
        aria-describedby={aria_describedby}
        defaultChecked={default_checked}
      />

      <label
        className="nhsuk-label nhsuk-radios__label"
        htmlFor={radio_input_id}
        id={radio_label_id}
      >
        {label}
      </label>
      {description && (
        <div
          className="nhsuk-hint nhsuk-radios__hint"
          id={radio_description_id}
        >
          {description}
        </div>
      )}
    </div>
  );
}

export interface CheckboxInputFieldProps {
  label: string;
  button_group: string;
  button_value: string;
  default_checked?: boolean;
  onChange?: (any) => void;
  error_ids?: string[];
}

export function CheckboxInputField({
  label,
  button_group,
  button_value,
  default_checked,
  onChange,
  error_ids,
}: CheckboxInputFieldProps) {
  const checkbox_unique_id = `${button_group}-${button_value.replaceAll(
    " ",
    "-"
  )}`;
  const checkbox_input_id = checkbox_unique_id + "-input";
  const checkbox_label_id = checkbox_unique_id + "-label";

  const aria_describedby = error_ids ? error_ids.join(" ") : undefined;

  return (
    <div className="nhsuk-checkboxes__item">
      <input
        className="nhsuk-checkboxes__input"
        id={checkbox_input_id}
        name={button_group}
        type="checkbox"
        value={button_value}
        defaultChecked={default_checked}
        aria-labelledby={checkbox_label_id}
        aria-describedby={aria_describedby}
        onChange={onChange}
      />
      <label
        className="nhsuk-label nhsuk-checkboxes__label"
        htmlFor={checkbox_input_id}
        id={checkbox_label_id}
      >
        {label}
      </label>
    </div>
  );
}
