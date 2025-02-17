import { RadioButtonInputField } from "app/shared/formFields";

interface RadioButtonRendererProps {
  errors?: string[];
}

export default function RoleSelector({ errors }: RadioButtonRendererProps) {
  const errors_to_display: JSX.Element[] = [];
  const error_ids: string[] = [];

  errors?.forEach((error, index) => {
    const error_id = `role-error-${index}`;
    error_ids.push(error_id);
    errors_to_display.push(
      <span className="nhsuk-error-message" key={error_id} id={error_id}>
        <span className="nhsuk-u-visually-hidden">Error:</span>
        {error}
      </span>
    );
  });

  return (
    <>
      <div className="nhsuk-radios">
        {errors_to_display}

        <RadioButtonInputField
          label="Data Analyst"
          button_group="role"
          button_value="Analyst"
          description={
            <p>
              User can access data through the SDE platform. After passing
              induction, these users will be charged at a standard fee of
              <strong> £380 per month</strong>, per agreement.
            </p>
          }
          error_ids={error_ids && error_ids}
        />

        <RadioButtonInputField
          label="User Manager"
          button_group="role"
          button_value="UserManager"
          description={
            <p>
              User can add and manage other users on the SDE. User Manager
              accounts are <strong>not charged</strong>.
            </p>
          }
          error_ids={error_ids && error_ids}
        />

        <RadioButtonInputField
          label="Both (Data Analyst and User Manager)"
          button_group="role"
          button_value="Both"
          description={
            <p>
              User can access data through the SDE platform and manage users.
              After passing induction, these users will be charged at a standard
              fee of
              <strong> £380 per month</strong>, per agreement.
            </p>
          }
          error_ids={error_ids && error_ids}
        />
      </div>
    </>
  );
}
