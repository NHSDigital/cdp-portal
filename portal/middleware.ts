import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import hasPermissions from "app/services/hasPermissions";

const PERMISSIONS_REQUIRED = ["portal.maintenance_access"];

const PASSWORD_SETUP_FLOW_ROUTES = [
  "/confirm-email-address",
  "/set-up-password",
  "/link-expired",
];

export default withAuth(
  async function middleware(req) {
    const url = new URL(req.url);
    const agreement_id = url.pathname.split("/")[2];
    const isMaintenanceEnabled = process.env.MAINTENANCE_MODE;

    if (isMaintenanceEnabled == "true") {
      const req_token = await getToken({ req });
      const user_email = req_token?.email;
      let userHasMaintainerRole = false;
      if (user_email) {
        userHasMaintainerRole = await hasPermissions({
          permissions_required: PERMISSIONS_REQUIRED,
          agreement_id: agreement_id,
          user_email: user_email,
        });
      }
      //users should be able to access the logout pages
      const request_path = req.nextUrl.pathname;

      if (
        !userHasMaintainerRole &&
        request_path !== "/maintenance" &&
        request_path !== "/logout_confirm"
      ) {
        return NextResponse.redirect(new URL("/maintenance", req.url));
      }
    }

    if (PASSWORD_SETUP_FLOW_ROUTES.includes(req.nextUrl.pathname)) {
      // if user logged in do not permit access to page
      if (await getToken({ req })) {
        return NextResponse.redirect(new URL("/404", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/welcome",
    },
    callbacks: {
      authorized({ req, token }) {
        const req_path = req.nextUrl.pathname;

        // allow user access to password setup routes when missing auth token
        // need to also allow maintanence so redirect work as intended
        if (
          (PASSWORD_SETUP_FLOW_ROUTES.includes(req_path) ||
            req_path == "/maintenance") &&
          !token
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets (logos, CSS, favicons)
     */
    "/((?!api|_next/static|_next/image|assets|welcome|logout_confirm|403|404|405|500).*)",
  ],
};
