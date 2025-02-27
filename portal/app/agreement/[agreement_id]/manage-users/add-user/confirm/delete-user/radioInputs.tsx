import { RadioButtonInputField } from "app/shared/formFields";
interface RadioInputsProps {
  errors: string;
}

export default function RadioInputs({ errors }: RadioInputsProps) {
  const button_group = "confirm";

  const errors_to_display = errors ? (
    <span className="nhsuk-error-message" key={"role" + errors}>
      <span className="nhsuk-u-visually-hidden">Error:</span>
      {errors}
    </span>
  ) : null;

  return (
    <div className="nhsuk-radios">
      <div
        className={
          errors_to_display
            ? "nhsuk-form-group nhsuk-form-group--error"
            : "nhsuk-form-group"
        }
      >
        {errors_to_display}

        <RadioButtonInputField
          label="Yes"
          button_group={button_group}
          button_value="yes"
        />
        <RadioButtonInputField
          label="No"
          button_group={button_group}
          button_value="no"
        />
      </div>
    </div>
  );
}
