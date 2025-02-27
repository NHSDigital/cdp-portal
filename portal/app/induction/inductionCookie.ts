import { cookies } from "next/headers";
import { INDUCTION_COOKIE_NAME, INDUCTION_COOKIE_EXPIRY } from "./consts";
import { getServerSessionErrorIfMissingProperties } from "app/shared/common";
import { getLogger } from "helpers/logging/logger";
import crypto from "crypto";

const rootLogger = getLogger("addUserLayout");

interface RawInductionCookie {
  answers?: { [index: string]: number[] };
  wrong?: number[];
  user?: string;
  passed?: boolean;
}

const EMPTY_INDUCTION_COOKIE = {
  cookie_answers: {},
  cookie_wrong: [],
};

export default async function parseInductionCookie(): Promise<{
  cookie_answers: { [index: string]: number[] };
  cookie_wrong: number[];
  cookie_passed?: boolean;
}> {
  if (!cookies().has(INDUCTION_COOKIE_NAME)) return EMPTY_INDUCTION_COOKIE;

  const existing_cookie = cookies().get(INDUCTION_COOKIE_NAME)?.value || "{}";
  const parsed_cookie: RawInductionCookie = JSON.parse(existing_cookie);

  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const logged_in_user_email = session.user.email;
  const hash = stringToHash(logged_in_user_email);

  if (!(parsed_cookie.user == hash)) {
    rootLogger.info("Hash of logged in user not found in existing cookie");
    return EMPTY_INDUCTION_COOKIE;
  }

  const cookie = {
    cookie_answers: parsed_cookie.answers || {},
    cookie_wrong: parsed_cookie.wrong || [],
  };

  if (parsed_cookie.passed) cookie["cookie_passed"] = parsed_cookie.passed;

  return cookie;
}

export async function setInductionCookie(
  answers: { [index: string]: number[] },
  wrong: number[],
  passed?: boolean
) {
  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const logged_in_user_email = session.user.email;

  const hash = stringToHash(logged_in_user_email);

  const cookie = {
    answers,
    wrong,
    user: hash,
  };

  if (passed) cookie["passed"] = passed;

  cookies().set(INDUCTION_COOKIE_NAME, JSON.stringify(cookie), {
    expires: Date.now() + INDUCTION_COOKIE_EXPIRY,
  });
}

export function stringToHash(input: string) {
  const hash = crypto.createHash("sha256");
  hash.update(input);

  const digest = hash.digest("hex");
  return digest;
}
