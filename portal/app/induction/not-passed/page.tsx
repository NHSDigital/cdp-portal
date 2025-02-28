import Link from "next/link";
import { QUESTIONS_ARRAY } from "../question/[question_number]/consts";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import parseInductionCookie from "../inductionCookie";
import getUserAgreements from "services/getUserAgreements";
import { getServerSessionErrorIfMissingProperties } from "app/shared/common";
import { getLogger } from "helpers/logging/logger";

const logger = getLogger("notPassed");

export const metadata: Metadata = {
  title: "Assessment not passed",
};

export default async function InductionFailedPage() {
  const { cookie_wrong } = await parseInductionCookie();

  if (cookie_wrong.length == 0) redirect("/");

  const session = await getServerSessionErrorIfMissingProperties(logger);
  const results = await getUserAgreements(session.user.email);
  if (!results.inductionNeeded || results.inductionPassed) redirect("/");

  const wrong_answer_data = cookie_wrong.map((number) => ({
    number,
    heading: QUESTIONS_ARRAY[number - 1].heading,
  }));

  return (
    <>
      <h1>Assessment not passed</h1>
      <p>
        You will need to retake the following questions. You can come back and
        do this at any time.
      </p>
      <p className="nhsuk-u-margin-bottom-6">
        For help with answering these questions, you can view the{" "}
        <a
          href="https://digital.nhs.uk/services/secure-data-environment-service/introduction"
          target="_blank"
        >
          SDE induction (opens in a new tab).
        </a>
      </p>

      <dl className="nhsuk-summary-list">
        {wrong_answer_data.map((question) => (
          <IncorrectQuestionRow
            key={question.number}
            number={question.number}
            heading={question.heading}
          />
        ))}
      </dl>

      <Link
        href={`/induction/question/${cookie_wrong[0]}`}
        className="nhsuk-button"
      >
        Retake these questions
      </Link>
    </>
  );
}

function IncorrectQuestionRow({
  number,
  heading,
}: {
  number: number;
  heading: string;
}) {
  return (
    <div className="nhsuk-summary-list__row">
      <dt className="nhsuk-summary-list__key nhsuk-u-padding-top-3 nhsuk-u-padding-bottom-3">
        Question {number}
      </dt>
      <dd className="nhsuk-summary-list__value nhsuk-u-padding-top-3 nhsuk-u-padding-bottom-3">
        {heading}
      </dd>
      <dd className="nhsuk-summary-list__actions nhsuk-u-padding-top-3 nhsuk-u-padding-bottom-3">
        <strong className="nhsuk-tag nhsuk-tag--red">Incorrect</strong>
      </dd>
    </div>
  );
}
