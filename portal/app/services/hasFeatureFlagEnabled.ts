import hasFeatureFlagEnabledGivenCookies from "./hasFeatureFlagEnabledGivenCookies";
import { cookies } from "next/headers";

export default async function hasFeatureFlagEnabled({
  featureFlagName,
}: {
  featureFlagName: string;
}): Promise<boolean> {
  const featureFlagCookie = cookies().get(`FEATURE-FLAG-${featureFlagName}`);
  const ff_cookie_enabled = featureFlagCookie?.value === "true";

  return hasFeatureFlagEnabledGivenCookies({
    featureFlagName,
    ff_cookie_enabled,
  });
}
