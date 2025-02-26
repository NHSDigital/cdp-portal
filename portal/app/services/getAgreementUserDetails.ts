import { notFound } from "next/navigation";
import { callLambdaWithoutFullErrorChecking } from "app/shared/callLambda";
import { getLoggerAndSession } from "app/shared/logging";
import {
  User,
  calculateUserStatus,
  changeBasicAgreementAccessToAnalyst,
} from "./getUsersInAgreement";

const LOGGER_NAME = "getAgreementUserDetails";

export default async function getAgreementUserDetails(
  agreement_id: string,
  user_email: string
): Promise<User> {
  const { logger } = await getLoggerAndSession(LOGGER_NAME, {
    agreementId: agreement_id,
  });
  try {
    // call lambda
    const resultJson = await callLambdaWithoutFullErrorChecking({
      function_name: process.env.GET_AGREEMENT_USER_DETAILS_ARN as string,
      raw_payload: {
        user_email: user_email,
        agreement_id: agreement_id,
      },
      logger,
    });

    if (resultJson.statusCode === 404) {
      logger.error({
        state: "User not found",
        status: 404,
      });
      notFound();
    } else if (resultJson.statusCode !== 200) {
      throw new Error(
        "resultJson.statusCode not 200 in getAgreementUserDetails request"
      );
    }

    let user = JSON.parse(resultJson.body);
    user = changeBasicAgreementAccessToAnalyst(user);
    user = calculateUserStatus(user);

    logger.info({ message: "Successfully retrieved user details" });

    return user;
  } catch (e) {
    if (e.digest == "NEXT_NOT_FOUND") {
      logger.error({
        state: "User not found",
        status: 404,
      });
      notFound();
    }

    logger.error({
      state: "Error in getUsersInAgreement request",
      status: 500,
      error: e,
    });
    throw new Error("Error getting agreement user details");
  }
}
