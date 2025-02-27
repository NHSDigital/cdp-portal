interface TextInputFieldProps {
  label: string;
  name: string;
  hint?: string | React.JSX.Element;
  errors?: string[];
  value?: string;
  width?: string;
  isPassword?: boolean;
}

export default function TextInputField({
  label,
  name,
  hint,
  errors,
  value,
  width = "nhsuk-input--width-20",
  isPassword = false,
}: TextInputFieldProps) {
  const text_input_id = name;

  const errors_to_display: JSX.Element[] = [];
  const error_ids: string[] = [];

  errors?.forEach((error, index) => {
    const error_id = `${text_input_id}-error-${index}`;
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
      <label
        className="nhsuk-label"
        htmlFor={text_input_id + "-input"}
        id={text_input_id + "-label"}
      >
        {label}
      </label>

      {errors_to_display}

      {hint && (
        <div className="nhsuk-hint" id={text_input_id + "-hint"}>
          {hint}
        </div>
      )}
      <input
        className={
          errors
            ? `nhsuk-input ${width} nhsuk-input--error`
            : `nhsuk-input ${width}`
        }
        type={isPassword ? "password" : "text"}
        name={name}
        defaultValue={value}
        id={text_input_id + "-input"}
        aria-labelledby={text_input_id + "-label"}
        aria-describedby={errors ? error_ids.join(" ") : undefined}
      />
    </div>
  );
}
