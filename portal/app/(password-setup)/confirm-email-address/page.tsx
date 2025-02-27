import React from "react";
import ConfirmEmailAddressPageContent from "./_components/ConfirmEmailAddressContent";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm email address",
};

interface ConfirmEmailAddressPageProps {
  searchParams: { id?: string };
}

export default function ConfirmEmailAddressPage({
  searchParams: { id },
}: ConfirmEmailAddressPageProps) {
  if (!id || typeof id != "string") {
    redirect("/");
  }

  return id && <ConfirmEmailAddressPageContent id={id} />;
}
