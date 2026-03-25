import { getServerSessionErrorIfMissingProperties } from 'app/shared/common';
import crypto from 'crypto';
import { getLogger } from 'helpers/logging/logger';
import { cookies } from 'next/headers';

import { CookieNames } from '@/config/constants';

const rootLogger = getLogger('addUserLayout');

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
  if (!(await cookies()).has(CookieNames.INDUCTION))
    return EMPTY_INDUCTION_COOKIE;

  const existing_cookie =
    (await cookies()).get(CookieNames.INDUCTION)?.value || '{}';
  const parsed_cookie: RawInductionCookie = JSON.parse(existing_cookie);

  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const logged_in_user_email = session.user.email;
  const hash = stringToHash(logged_in_user_email);

  if (!(parsed_cookie.user == hash)) {
    rootLogger.info('Hash of logged in user not found in existing cookie');
    return EMPTY_INDUCTION_COOKIE;
  }

  const cookie = {
    cookie_answers: parsed_cookie.answers || {},
    cookie_wrong: parsed_cookie.wrong || [],
  };

  if (parsed_cookie.passed) cookie['cookie_passed'] = parsed_cookie.passed;

  return cookie;
}

export async function setInductionCookie(
  answers: { [index: string]: number[] },
  wrong: number[],
  passed?: boolean,
) {
  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const logged_in_user_email = session.user.email;

  const hash = stringToHash(logged_in_user_email);

  const cookie = {
    answers,
    wrong,
    user: hash,
  };

  if (passed) cookie['passed'] = passed;

  (await cookies()).set(CookieNames.INDUCTION, JSON.stringify(cookie), {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  });
}

export function stringToHash(input: string) {
  const hash = crypto.createHash('sha256');
  hash.update(input);

  const digest = hash.digest('hex');
  return digest;
}
