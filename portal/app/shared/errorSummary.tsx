import { useEffect } from "react";

interface Errors {
  input_id: string;
  errors_list?: string[];
}
interface ErrorSummaryProps {
  errors: Errors[];
}

export default function ErrorSummary({ errors }: ErrorSummaryProps) {
  const filtered_errors = errors.filter(
    (error) => error.errors_list !== undefined
  );

  useEffect(() => {
    if (filtered_errors.length === 0) {
      if (document.title.startsWith("Error:")) {
        document.title = document.title.slice("Error:".length);
      }
      return;
    } else {
      if (!document.title.startsWith("Error:")) {
        document.title = "Error: " + document.title;
      }
    }
  });

  if (filtered_errors.length === 0) {
    return null;
  }

  const errors_to_display = filtered_errors.map(({ input_id, errors_list }) => {
    if (errors_list === undefined) {
      return null;
    }

    return errors_list?.map((error) => {
      return (
        <li key={input_id + error}>
          <a href={"#" + input_id.replaceAll(" ", "-")}>{error}</a>
        </li>
      );
    });
  });

  return (
    <div
      className="nhsuk-error-summary"
      id="error-summary"
      aria-labelledby="error-summary-title"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="nhsuk-error-summary__title" id="error-summary-title">
        There is a problem
      </h2>
      <div className="nhsuk-error-summary__body">
        <ul
          className="nhsuk-list nhsuk-error-summary__list"
          role="list"
          id="error-summary"
        >
          {errors_to_display}
        </ul>
      </div>
    </div>
  );
}
