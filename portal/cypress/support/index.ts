export {};
declare global {
  // Each user type available must have a corresponding environment variable CYPRESS_${user_type}_TEST_CREDENTIALS
  // Set this is ./scripts/cypress-open-local.sh and ./scripts/cypress-run.sh
  type AllowedUserType =
    | "ANALYST"
    | "USER_MANAGER"
    | "SUPPORT_ADMIN"
    | "MAINTAINER";
  namespace Cypress {
    interface Chainable {
      full_login(user_type: AllowedUserType): Chainable<void>;
    }
  }
}
