import { getLogger } from 'helpers/logging/logger';
import { headers } from 'next/headers';

import { getServerSessionErrorIfMissingProperties } from './common';

export async function getLoggerAndSession(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optionalKeys?: { [key: string]: any },
) {
  const rootLogger = getLogger(name);

  // Add user_id and ip_address to all logs
  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const logged_in_user_email = session.user.email;
  const logged_in_user_ip_address = headers().get('X-Forwarded-For');

  const logger = rootLogger.child({
    user_id: logged_in_user_email,
    ip_address: logged_in_user_ip_address,
    ...optionalKeys,
  });

  return { logger, session };
}
