import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { BackLink } from "nhsuk-react-components";
import React, { useRef } from "react";
import BasePage from "../components/BasePage";
import { authOptions } from "./api/auth/[...nextauth]";

const LogoutConfirm = () => {
  const mainRef = useRef(null);

  return (
    <BasePage mainRef={mainRef}>
      <Head>
        <title>Logout successful - SDE</title>
      </Head>
      <main style={{ paddingTop: "4rem", paddingBottom: "4rem" }} ref={mainRef}>
        <h1>You are logged out.</h1>
        <p>
          Please make sure to close any other tabs to ensure you are logged out
          completely.
        </p>
        <BackLink asElement={Link} href="/">
          Go back to home
        </BackLink>
      </main>
    </BasePage>
  );
};

export default LogoutConfirm;

export const getServerSideProps: GetServerSideProps<{}> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session?.user) {
    return {
      redirect: {
        destination: "/500",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
