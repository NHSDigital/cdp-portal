import BackLink from "./shared/backLink";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Method not allowed",
};

export default function Page403() {
  return (
    <>
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-three-quarters">
          <h1>You do not have permission to access this page</h1>
          <p>
            If you are seeing this page in error, contact the National Service
            Desk on 0300 303 5035, or email{" "}
            <a
              href="mailto:ssd.nationalservicedesk@nhs.net"
              target="_blank"
            ></a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
