import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance Page",
};

export default function MaintenancePage() {
  return (
    <>
      <h1>Service is unavailable</h1>
      <p>
        This service is currently undergoing maintenance and will be available
        soon. This should not take more than a few hours.
      </p>
      <p>
        If you have an urgent issue, contact the National Service Desk on 0300
        303 5035, or email{" "}
        <a href="mailto:ssd.nationalservicedesk@nhs.net" target="_blank">
          ssd.nationalservicedesk@nhs.net
        </a>
      </p>
    </>
  );
}
