import getSSMParameter from "./getSSMParameter";
import { getLogger } from "../../helpers/logging/logger";

const logger = getLogger("hasFeatureFlagEnabledGivenCookies");

const FEATURE_FLAG_PREFIX: string =
  process.env.AWS_ENVIRONMENT_PREFIX !== undefined
    ? `/${process.env.AWS_ENVIRONMENT_PREFIX}portal/feature-flags/`
    : "/portal/feature-flags/";

export async function hasFeatureFlagEnabledGivenContextReq({
  featureFlagName,
  context_req,
}: {
  featureFlagName: string;
  context_req: any;
}): Promise<boolean> {
  const ff_cookie_enabled =
    context_req.cookies[`FEATURE-FLAG-${featureFlagName}`] === "true";

  return hasFeatureFlagEnabledGivenCookies({
    featureFlagName,
    ff_cookie_enabled,
  });
}

export default async function hasFeatureFlagEnabledGivenCookies({
  featureFlagName,
  ff_cookie_enabled,
}: {
  featureFlagName: string;
  ff_cookie_enabled: boolean;
}): Promise<boolean> {
  const parameterName = `${FEATURE_FLAG_PREFIX}${featureFlagName}`;

  const response = await getSSMParameter({
    parameterName: parameterName,
  });

  switch (response?.toLowerCase()) {
    case "on":
    case "true":
      return true;
    case "off":
    case "false":
      return false;
    case "off_without_cookie":
      if (ff_cookie_enabled) {
        logger.debug({
          state: "Feature flag enabled by cookie",
          featureFlagName: featureFlagName,
        });
        return true;
      } else {
        return false;
      }

    default:
      logger.error({
        state: "Invalid feature flag value",
        value: response,
      });
      return false;
  }
}
