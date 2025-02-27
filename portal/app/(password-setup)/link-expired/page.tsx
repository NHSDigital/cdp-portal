import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CookieNames } from "types/enums";
import LinkExpiredContent from "./_components/LinkExpiredContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link expired",
};

export default function LinkExpiredPage() {
  const email = cookies().get(CookieNames.CONFIRMED_EMAIL)?.value;

  if (!email) {
    redirect("/");
  }

  return <LinkExpiredContent email={email} />;
}
