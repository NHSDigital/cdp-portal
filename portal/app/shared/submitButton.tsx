import React from "react";
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
}: {
  children: React.ReactNode;
}) {
  // Disable the submit button when the form is pending
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="nhsuk-button" disabled={pending}>
      {children}
    </button>
  );
}
