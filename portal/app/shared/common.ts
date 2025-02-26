import { ISODateString, getServerSession } from "next-auth";
import { Logger } from "pino";

export const NO_TIMESTAMP_TEXT = "-";

export function logAndError(logger: Logger, errMsg: any): never {
  logger.error(errMsg);
  throw new Error(errMsg);
}

export interface PortalSession {
  user: {
    name: string;
    email: string;
  };
  expires: ISODateString;
}

export async function getServerSessionErrorIfMissingProperties(
  logger: Logger,
  ...args: Parameters<typeof getServerSession>
): Promise<PortalSession> {
  const session = await getServerSession(...args);
  if (!session?.user?.email || !session?.user?.name) {
    logAndError(
      logger,
      "Expected user to be logged in and have a name and email"
    );
  }
  return session as PortalSession;
}

export function getFormattedRole(roles?: string[]) {
  if (!roles) {
    return undefined;
  }
  switch (true) {
    case roles.includes("UserManager") && roles.includes("Analyst"):
      return "Both (Data Analyst and User Manager)";
    case roles.includes("UserManager"):
      return "User Manager";
    case roles.includes("Analyst"):
      return "Data Analyst";
    default:
      return undefined;
  }
}

export function getFormattedTimestamp(timestamp?: string) {
  return timestamp
    ? new Date(timestamp).toLocaleDateString("en-GB", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : NO_TIMESTAMP_TEXT;
}

export function getFormattedFleetType(fleet_type?: string) {
  switch (fleet_type) {
    case "default":
      return "4 GB";
    case "large":
      return "8 GB";
    case "xlarge":
      return "16 GB";
    case "xxlarge":
      return "32 GB";
    case "review_file":
      return "2 GB";
  }
}
