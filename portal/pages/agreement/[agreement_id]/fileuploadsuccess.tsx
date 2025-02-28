import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, InsetText } from "nhsuk-react-components";
import { useRef } from "react";
import BasePage from "../../../components/BasePage";
import getNotifications, { Notices } from "../../../services/getNotifications";

const AgreementPage = ({ notificationItems }: Notices) => {
  const router = useRouter();
  const mainRef = useRef(null);
  const { agreement_id } = router.query as {
    agreement_id: string;
  };

  return (
    <BasePage mainRef={mainRef} notificationItems={notificationItems}>
      <Head>
        <title>Reference Data Uploaded - SDE</title>
      </Head>
      <main style={{ paddingTop: "4rem", paddingBottom: "4rem" }} ref={mainRef}>
        <h1>
          <span className="nhsuk-caption-l">
            {agreement_id}
            <span className="nhsuk-u-visually-hidden"> - </span>
          </span>
          Your file is being checked
        </h1>
        <p>
          You will receive a confirmation email once the file has been checked.
          This should take less than 24 hours.
        </p>
        <p>
          If there are any technical errors we will tell you what you need to
          amend.
        </p>
        <h2>What you need to do next</h2>
        <InsetText>
          <p>
            In order for your request to be processed, please ensure that you
            now provide contextual information to{" "}
            <a href="mailto:england.sde.input-checks@nhs.net" target="_blank">
              england.sde.input-checks@nhs.net
            </a>
            .
          </p>
          <p>
            This should explain what the data contains and how it will
            complement other data to help you with your research.
          </p>
          <p>
            <a
              href="https://digital.nhs.uk/services/secure-data-environment-service/secure-data-environment/user-guides/import-reference-data#providing-contextual-information"
              target="blank"
            >
              Learn more about how to send contextual information (opens in a
              new window).
            </a>
          </p>
        </InsetText>
        <h2>Safe Input Service</h2>
        <p>
          Once we have received your contextual information and checked your
          uploaded file(s), the Safe Input Service will check for Personally
          Identifiable Information (PII).
        </p>
        <p>
          If your data fails to meet the mandatory criteria, you will receive an
          email explaining why and how to correct it.
        </p>
        <p>
          If it meets the requirements, you will receive an email when the data
          is ready to use within the Secure Data Environment.
        </p>
        <p>We aim to respond to all requests within 5 working days.</p>
        <br />
        {/* @ts-ignore */}
        <Button as={Link} href={`../${agreement_id}`}>
          Finish
        </Button>
        <p></p>
        {/* @ts-ignore */}
        <Button secondary={true} as={Link} href="./fileupload">
          Upload another file
        </Button>
      </main>
    </BasePage>
  );
};

export default AgreementPage;

export const getServerSideProps: GetServerSideProps<Notices> = async () => {
  const notificationItems = await getNotifications();

  return {
    props: {
      notificationItems,
    },
  };
};
