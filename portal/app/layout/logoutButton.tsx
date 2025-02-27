"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import layoutStyles from "./layout.module.css";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const onLogoutSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const resp = await fetch("/api/signout", {
      method: "POST",
    });

    const callbackUrl = resp.status === 204 ? "/logout_confirm" : "/500";

    await signOut({ callbackUrl });
  };

  return (
    <form method="POST" action="/api/signout" onSubmit={onLogoutSubmit}>
      <input
        type="submit"
        className={`nhsuk-button nhsuk-button--reverse ${layoutStyles.logoutButton}`}
        data-module="nhsuk-button"
        value="Logout"
        disabled={isLoading}
      />
    </form>
  );
}
