import Head from "next/head";
import Link from "next/link";
import { BackLink } from "nhsuk-react-components";
import { useRef } from "react";
import BasePage from "../components/BasePage";

const Page404 = () => {
  const mainRef = useRef(null);

  return (
    <BasePage mainRef={mainRef}>
      <Head>
        <title>Error accessing page - SDE</title>
      </Head>
      <main style={{ paddingTop: "4rem", paddingBottom: "4rem" }} ref={mainRef}>
        <h1>Error accessing page</h1>
        <p>Something went wrong when you tried to access this page.</p>
        <p>
          It could be that you accessed a page through an incorrect link. Please
          try again from the beginning or try again later.
        </p>
        <p>
          If you are seeing this page repeatedly, contact NHS England on 0300
          303 5678, or email{" "}
          <a href="mailto:enquiries@nhsdigital.nhs.uk" target="_blank">
            enquiries@nhsdigital.nhs.uk
          </a>
        </p>
        <BackLink asElement={Link} href="/">
          Go back to home
        </BackLink>
      </main>
    </BasePage>
  );
};

export default Page404;
