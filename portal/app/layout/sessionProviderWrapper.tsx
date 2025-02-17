"use client";

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useLogoutIfSessionExpires } from "../../components/BasePage";

interface Props {
  children: React.ReactNode;
  initialSession: Session | null;
}

export default function SessionProviderWrapper({
  children,
  initialSession,
}: Props) {
  // Next Auth JS' refetch on window focus wasn't working in the app router, so we have to do it manually
  return (
    <SessionProvider session={initialSession} refetchOnWindowFocus={true}>
      <AutoRefreshSession />
      {children}
    </SessionProvider>
  );
}

function AutoRefreshSession() {
  const router = useRouter();
  useLogoutIfSessionExpires(router);

  return null;
}
