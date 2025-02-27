import { UserToAdd } from "./types";
import ConfirmationCheckbox from "./confirmationCheckbox";

export default function AcceptAndConfirmForm({
  cookieAddedUser,
  submitUsers,
  createOneUserNoJSFormAction,
  error,
}: {
  cookieAddedUser: UserToAdd;
  submitUsers: (e) => void;
  createOneUserNoJSFormAction: (form_data: FormData) => void;
  error: string;
}) {
  return (
    <form
      action={createOneUserNoJSFormAction}
      onSubmit={(e) => {
        e.preventDefault();

        submitUsers(e);
      }}
    >
      <input type="hidden" name="email" value={cookieAddedUser.email} />
      <input
        type="hidden"
        name="first_name"
        value={cookieAddedUser.first_name}
      />
      <input type="hidden" name="last_name" value={cookieAddedUser.last_name} />
      <input type="hidden" name="role" value={cookieAddedUser.role} />
      <div>
        <ConfirmationCheckbox
          errors={error ? [error] : undefined}
          label={
            "I accept the above costs and confirm that the details I have provided are correct."
          }
          name="final_confirm"
        />
        <div className="nhsuk-u-padding-bottom-9"></div>
        <p>
          <button className="nhsuk-button">Confirm users</button>
        </p>
      </div>
    </form>
  );
}
