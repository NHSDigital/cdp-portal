import { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { JWT, getToken } from "next-auth/jwt";
import { getLogger } from "../../helpers/logging/logger";
import { authOptions, keycloak } from "./auth/[...nextauth]";

const requestIp = require("request-ip");

const logger = getLogger("switchAgreement");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const session = (await getServerSession(req, res, authOptions)) as Session;

    const user_id = session.user?.email;
    const user_ip_address = requestIp.getClientIp(req);
    const { agreement_id } = req.body;

    const log_message = {
      user_id: user_id,
      ip_address: user_ip_address,
      agreement_id: agreement_id,
    };
    const child_logger = logger.child(log_message);

    child_logger.debug("User requested logout");

    const token = (await getToken({ req })) as JWT; //gitsecrets:ignore

    child_logger.debug("Logging out from keycloak");

    const keycloakLogoutResp = await fetch(
      // @ts-ignore
      `${keycloak.options.issuer}/protocol/openid-connect/logout`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `client_id=${encodeURIComponent(
          // @ts-ignore
          keycloak.options.clientId
        )}&client_secret=${encodeURIComponent(
          // @ts-ignore
          keycloak.options.clientSecret
          // @ts-ignore
        )}&refresh_token=${encodeURIComponent(token.refreshToken)}`,
      }
    );

    if (keycloakLogoutResp.status !== 204) {
      child_logger.error(
        {
          keycloak_response: await keycloakLogoutResp.text(),
          statusCode: keycloakLogoutResp.status,
        },
        "Failed to logout in keycloak"
      );
      throw new Error("Failed to logout user in Keycloak");
    }

    // Because next auth js is dumb, you can't logout from the server side
    // We gotta leave it to their endpoint or to the client side
    if (req.body.uses_js) {
      return res.redirect("/api/auth/signout");
    } else {
      return res.status(204).json({ message: "success" });
    }
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "An unknown error occurred" });
  }
};

export default handler;
