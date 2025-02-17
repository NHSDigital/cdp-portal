import { getLogger } from "helpers/logging/logger";
import { getServerSessionErrorIfMissingProperties } from "./common";
import { headers } from "next/headers";

export async function getLoggerAndSession(
  name: string,
  optionalKeys?: { [key: string]: any }
) {
  const rootLogger = getLogger(name);

  // Add user_id and ip_address to all logs
  const session = await getServerSessionErrorIfMissingProperties(rootLogger);
  const logged_in_user_email = session.user.email;
  const logged_in_user_ip_address = headers().get("X-Forwarded-For");

  const logger = rootLogger.child({
    user_id: logged_in_user_email,
    ip_address: logged_in_user_ip_address,
    ...optionalKeys,
  });

  return { logger, session };
}
