import { Button } from "nhsuk-react-components";
import React from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";

export default function WelcomeButton() {
  const {
    query: { callbackUrl },
  } = useRouter();

  return (
    <Button
      // @ts-ignore
      as="input"
      type="submit"
      className="welcomeButton"
      onClick={() =>
        signIn("keycloak", {
          callbackUrl:
            (Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl) ?? "/",
        })
      }
    >
      Sign in
    </Button>
  );
}
