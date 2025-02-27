import Head from "next/head";
import Link from "next/link";
import { BackLink } from "nhsuk-react-components";
import React, { useRef } from "react";
import BasePage from "../components/BasePage";

const Page403 = () => {
  const mainRef = useRef(null);

  return (
    <BasePage mainRef={mainRef}>
      <Head>
        <title>Method not allowed - SDE</title>
      </Head>
      <main style={{ paddingTop: "4rem", paddingBottom: "4rem" }} ref={mainRef}>
        <h1>Sorry, something went wrong</h1>
        <p>
          We weren&apos;t able to complete the request you just sent. Please try
          again, or contact support if the error persists.
        </p>
        <BackLink asElement={Link} href="/">
          Go back to home
        </BackLink>
      </main>
    </BasePage>
  );
};

export default Page403;
