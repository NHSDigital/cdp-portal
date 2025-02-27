import { List } from "cypress/types/lodash";
import { notFound } from "next/navigation";
import { getLogger } from "../../helpers/logging/logger";

const logger = getLogger("manageUsers");

interface queryPermissionsServiceProps {
  user_email: string;
  action: string;
  dsa?: string;
  target_user?: string;
}

type Outcome = "grant" | "deny";

export interface PermissionServiceResponse {
  status: number;
  outcome?: Outcome;
  action?: string;
  permitted_dsas?: List<string>; // list of dsas or could contain single asterisk ['*'] if permitted globally
}

export default async function queryPermissionsService({
  user_email,
  action,
  dsa,
  target_user,
}: queryPermissionsServiceProps): Promise<PermissionServiceResponse> {
  try {
    if (process.env.PERMISSIONS_API_GATEWAY_ID == undefined) notFound();

    // encoded to permit "+" in email addresses
    const user_param_value = encodeURIComponent(user_email);

    const base_url = `https://${process.env.PERMISSIONS_API_GATEWAY_ID}.execute-api.eu-west-2.amazonaws.com/v1/permissions`;
    let query = `action=${action}&user=${user_param_value}`;
    if (dsa !== undefined) {
      query = query.concat(`&dsa=${dsa}`);
    }
    if (target_user !== undefined) {
      // encoded to permit "+" in email addresses
      const target_user_param_value = encodeURIComponent(target_user);
      query = query.concat(`&target_user=${target_user_param_value}`);
    }

    const request_url = `${base_url}?${query}`;

    logger.debug({ state: "Fetching permissions API", url: request_url });

    const response = await fetch(request_url, {
      method: "GET",
    });

    if (response.status !== 200) {
      return {
        status: response.status,
      };
    }

    const body = await response.json();

    logger.debug({
      outcome: body.outcome,
      action: body.action,
      permitted_dsas: body.dsa,
    });

    return {
      status: response.status,
      outcome: body.outcome,
      action: body.action,
      permitted_dsas: body.dsa,
    };
  } catch (e) {
    logger.error({ state: "Error in fetch to permissions API", status: 500 });
    throw new Error("Error in fetch to permissions API");
  }
}
