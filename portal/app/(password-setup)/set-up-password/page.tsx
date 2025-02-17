"use client";

import React from "react";
import TextInputField from "app/shared/textInputField";
import SubmitButton from "app/shared/submitButton";

export default function SetUpPasswordPage() {
  const hint_message = (
    <>
      <p>Your password must:</p>
      <ul>
        <li>have 12 characters or more</li>
        <li>have at least one lowercase and one uppercase letter </li>
        <li>have at least one number </li>
        <li>have at least one special character such as ?!@” </li>
      </ul>
      <p>Your password must not:</p>
      <ul>
        <li>be the same as a previous password </li>
        <li>have repeating characters next to each other such as 11 or aa</li>
      </ul>
    </>
  );
  return (
    <>
      <h1>Set up password</h1>
      <form>
        <TextInputField
          label="Enter password"
          name="enter_password"
          hint={hint_message}
        />
        <TextInputField label="Confirm password" name="confirm_password" />
        <SubmitButton>Continue</SubmitButton>
      </form>
    </>
  );
}
