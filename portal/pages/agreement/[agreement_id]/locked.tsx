import Head from "next/head";
import Link from "next/link";
import { BackLink } from "nhsuk-react-components";
import { useRef } from "react";
import BasePage from "../../../components/BasePage";

const PageLocked = () => {
  const mainRef = useRef(null);

  return (
    <BasePage mainRef={mainRef}>
      <Head>
        <title>Aborting Virtual Desktop - SDE</title>
      </Head>
      <main style={{ paddingTop: "4rem", paddingBottom: "4rem" }} ref={mainRef}>
        <h1>
          We are still aborting your previous request to launch the virtual
          desktop{" "}
        </h1>
        <p>
          {" "}
          This can happen when the virtual desktop is launched in quick
          succession.{" "}
        </p>
        <p>Please go back to the home page and try again.</p>
        <BackLink asElement={Link} href="/">
          Go back to home
        </BackLink>
      </main>
    </BasePage>
  );
};

export default PageLocked;
