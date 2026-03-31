import { NextRequest } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { getToken, JWT } from 'next-auth/jwt';

import { keycloak } from '@/app/api/auth/[...nextauth]/config';
import { getLogger } from '@/helpers/logging/logger';

const logger = getLogger('switchAgreement');

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession()) as Session;

    const user_id = session.user?.email;
    const user_ip_address = req.headers.get('X-Forwarded-For') || 'unknown';
    const app_type = req.headers.get('Content-Type');
    let requestBody;
    if (app_type === 'application/x-www-form-urlencoded') {
      requestBody = Object.fromEntries(await req.formData());
      requestBody.uses_js = requestBody.uses_js.toLowerCase() === 'true';
    } else {
      requestBody = await req.json();
    }
    const { agreement_id } = requestBody;

    const log_message = {
      user_id: user_id,
      ip_address: user_ip_address,
      agreement_id: agreement_id,
    };
    const child_logger = logger.child(log_message);

    child_logger.debug('User requested logout');

    const token = (await getToken({ req })) as JWT; //gitsecrets:ignore

    child_logger.debug('Logging out from keycloak');

    const keycloakLogoutResp = await fetch(
      //@ts-ignore
      `${keycloak.options.issuer}/protocol/openid-connect/logout`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${encodeURIComponent(
          // @ts-ignore
          keycloak.options.clientId,
        )}&client_secret=${encodeURIComponent(
          // @ts-ignore
          keycloak.options.clientSecret,
          // @ts-ignore
        )}&refresh_token=${encodeURIComponent(token.refreshToken)}`,
      },
    );

    if (keycloakLogoutResp.status !== 204) {
      child_logger.error(
        {
          keycloak_response: await keycloakLogoutResp.text(),
          statusCode: keycloakLogoutResp.status,
        },
        'Failed to logout in keycloak',
      );
      throw new Error('Failed to logout user in Keycloak');
    }

    // Because next auth js is dumb, you can't logout from the server side
    // We gotta leave it to their endpoint or to the client side
    if (!requestBody.uses_js) {
      child_logger.debug('No javascript, redirecting to next auth signout');
      return Response.redirect(`${process.env.NEXTAUTH_URL}/api/auth/signout`);
    } else {
      // need to use new Response for status code 204, also status code 204 cannot have a response body
      // https://github.com/vercel/next.js/discussions/51475
      return new Response(null, { status: 204 });
    }
  } catch (err) {
    logger.error(err);
    return Response.json(
      {
        message: 'An unknown error occurred',
      },
      { status: 500 },
    );
  }
}
