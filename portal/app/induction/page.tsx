import Link from "next/link";
import { QUESTIONS_ARRAY } from "./question/[question_number]/consts";
import { Metadata } from "next";
import parseInductionCookie from "./inductionCookie";
import getUserAgreements from "services/getUserAgreements";
import { redirect } from "next/navigation";
import { getServerSessionErrorIfMissingProperties } from "app/shared/common";
import { getLogger } from "helpers/logging/logger";

const logger = getLogger("inductionPage");

export const metadata: Metadata = {
  title: "Complete the induction assessment",
};

export default async function InductionPage() {
  const link_question_number = await getNextUncompletedQuestionNumber();

  const session = await getServerSessionErrorIfMissingProperties(logger);
  const results = await getUserAgreements(session.user.email);
  if (!results.inductionNeeded || results.inductionPassed) redirect("/");

  return (
    <>
      <h1>Complete the induction assessment</h1>
      <p>
        Before accessing the SDE, you will need to complete this short
        assessment to test your knowledge of how the SDE works.
      </p>
      <p>Before you start:</p>
      <ul>
        <li>
          make sure you have read the{" "}
          <a
            href="https://digital.nhs.uk/services/secure-data-environment-service/introduction"
            target="_blank"
          >
            Introduction to the Secure Data Environment (opens in a new window)
          </a>
        </li>
      </ul>
      <p>This assessment:</p>
      <ul>
        <li>contains 10 questions</li>
        <li>takes approximately 15 minutes to complete</li>
      </ul>
      <p>
        You must answer all questions correctly to pass. You can retake this
        assessment as many times as you need to. You can also come back to
        complete it later.
      </p>
      <p>
        After you have passed the assessment, you will be able to access data
        through the SDE.
      </p>
      <Link
        href={`/induction/question/${link_question_number}`}
        className="nhsuk-button"
      >
        Continue
      </Link>
    </>
  );
}

async function getNextUncompletedQuestionNumber() {
  const { cookie_answers } = await parseInductionCookie();

  if (!cookie_answers) return 1;

  for (let index = 1; index <= QUESTIONS_ARRAY.length; index++) {
    if (!(index.toString() in cookie_answers)) return index;
  }
}
