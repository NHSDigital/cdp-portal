import Head from "next/head";
import Link from "next/link";
import { BackLink } from "nhsuk-react-components";
import { useRef } from "react";
import BasePage from "../components/BasePage";

const Page500 = () => {
  const mainRef = useRef(null);

  return (
    <BasePage mainRef={mainRef}>
      <Head>
        <title>Unexpected Error - SDE</title>
      </Head>
      <main style={{ paddingTop: "4rem", paddingBottom: "4rem" }} ref={mainRef}>
        <h1>Sorry, there is a problem with the service</h1>
        <p>Try again later.</p>
        <p>
          If you need help using the SDE please raise a service request with our
          National Service Desk on 0300 303 5035 or email{" "}
          <a href="mailto:ssd.nationalservicedesk@nhs.net" target="_blank">
            ssd.nationalservicedesk@nhs.net
          </a>
          .
        </p>
        <p>
          To ensure your request is handled swiftly, please state that it
          relates to Secure Data Environment and include your NIC number (if
          known) and any relevant screenshots.
        </p>
        <BackLink asElement={Link} href="/">
          Go back to home
        </BackLink>
      </main>
    </BasePage>
  );
};

export default Page500;
