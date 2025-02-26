import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import parseInductionCookie from "../inductionCookie";

export const metadata: Metadata = {
  title: "Assessment passed",
};

export default async function InductionPassedPage() {
  const { cookie_passed } = await parseInductionCookie();

  if (cookie_passed != true) redirect("/");

  return (
    <>
      <div className="nhsuk-hero nhsuk-u-margin-bottom-9">
        <div className="nhsuk-width-container nhsuk-hero--border">
          <div className="nhsuk-hero__wrapper nhsuk-u-padding-left-5 nhsuk-u-padding-right-5 nhsuk-u-text-align-centre">
            <h1 className="nhsuk-u-margin-bottom-6">Assessment passed</h1>
            <p className="nhsuk-body-l nhsuk-u-margin-bottom-0">
              All questions answered correctly
            </p>
          </div>
        </div>
      </div>

      <h2 className="nhsuk-u-margin-bottom-7">What happens next</h2>

      <p className="nhsuk-u-margin-bottom-5">
        Your account has been activated. You can now access data through the
        SDE.
      </p>

      <p className="nhsuk-u-margin-bottom-6">
        By entering the SDE, you agree to act according to the{" "}
        <a
          target="_blank"
          href="https://digital.nhs.uk/services/secure-data-environment-service/log-in/end-user-access-agreement"
        >
          NHS England SDE End User Access Agreement (EUAA) (opens in a new
          window)
        </a>
        .
      </p>

      {/* This needs to be an <a> tag and not a <Link> tag as some strange caching can cause users who have already done their induction to go back to the start of the induction process */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="nhsuk-button nhsuk-u-margin-bottom-6">
        Go to SDE Portal
      </a>

      <p>
        <a
          target="_blank"
          href="https://forms.office.com/Pages/ResponsePage.aspx?id=slTDN7CF9UeyIge0jXdO43L70IbmepFKuBMbd1ZKLFtUMlBOOFBIUVhLWTlQTjFCSlgyRVhHV0tDSCQlQCN0PWcu"
        >
          What did you think of the induction (opens in a new window)?
        </a>
      </p>
    </>
  );
}
