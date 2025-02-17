import {
  confirmChangeActivationUrl,
  describe_only_if_manage_users_flag_enabled,
  user_analyst_nc,
  user_data_wrangler_nc,
  user_support_admin_nc,
  setUserActivation,
  userDetailsUrl,
} from "../utils";

//---------------------------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]/manage-users/[user_id]/confirm-change-activation"
//---------------------------------------------------------------------------------------------

beforeEach(() => {});

describe_only_if_manage_users_flag_enabled(
  "confirm-change-user-activation page tests - Analyst",
  () => {
    it("cannot view page", () => {
      cy.full_login("ANALYST");
      cy.visit(confirmChangeActivationUrl(user_analyst_nc.email), {
        failOnStatusCode: false,
      });
      // Analyst gets the missing permission error (403)
      cy.get("h1").contains("You do not have permission to access this page");
    });
  }
);

describe_only_if_manage_users_flag_enabled(
  "confirm-change-user-activation page tests - UserManager",
  () => {
    beforeEach(() => {
      cy.full_login("USER_MANAGER");
    });

    it("can view page and appears correct", () => {
      cy.visit(confirmChangeActivationUrl(user_analyst_nc.email));
      setUserActivation(user_analyst_nc.email, true);
      // Verify page contains the correct information
      cy.get("h1")
        .contains(`Deactivate ${user_analyst_nc.name}`)
        .should("exist");
      cy.get("p").contains("users will receive an email").should("exist");
      cy.get('input[name="confirm"][value="Yes"]').should("exist");
      cy.get('input[name="confirm"][value="No"]').should("exist");
      cy.get("button").contains("Continue").should("exist");
    });
    it("cannot access page if data wrangler or support admin", () => {
      cy.visit(confirmChangeActivationUrl(user_data_wrangler_nc.email));
      cy.get("h1")
        .contains("You do not have permission to access this page")
        .should("exist");
      cy.visit(confirmChangeActivationUrl(user_support_admin_nc.email));
      cy.get("h1")
        .contains("You do not have permission to access this page")
        .should("exist");
    });

    it("clicking continue without selecting option shows an error", () => {
      setUserActivation(user_analyst_nc.email, true);
      cy.visit(confirmChangeActivationUrl(user_analyst_nc.email));
      cy.get("h1")
        .contains(`Deactivate ${user_analyst_nc.name}`)
        .should("exist");
      cy.get("button").contains("Continue").click();
      cy.get("a")
        .contains("Select yes to deactivate this user")
        .should("exist");
      cy.get("h1")
        .contains(`Deactivate ${user_analyst_nc.name}`)
        .should("exist");
      setUserActivation(user_analyst_nc.email, true);
    });

    it("clicking no takes you back to the user details page", () => {
      cy.visit(confirmChangeActivationUrl(user_analyst_nc.email));
      // Verify page contains the correct information
      cy.get("h1").contains("activate").should("exist");
      cy.get('input[name="confirm"][value="No"]').click();
      cy.get("button").contains("Continue").click();
      cy.get("p").contains("To update this user").should("exist");
    });

    it("can change a user's activation and this updates user details page", () => {
      // ensure users activation to is ACTIVATED before starting tests
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_nc.email,
        done_induction: true,
      });
      setUserActivation(user_analyst_nc.email, true);
      // change users activation to DEACTIVATED
      cy.visit(confirmChangeActivationUrl(user_analyst_nc.email));
      cy.get("h1").contains("Deactivate").should("exist");
      cy.get('input[name="confirm"][value="Yes"]').click();
      cy.get("button").contains("Continue").click();
      // should get redirected to manage users page and alert should appear
      cy.get("h1", { timeout: 15 * 2000 })
        .contains("Manage users", { timeout: 15 * 2000 })
        .should("exist");
      cy.get("p span").contains(
        /automated-test analyst-user-change-role has been deactivated\./
      );
      // going to user details page and should see deactivation timestamp
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get("dt").contains("Deactivated").should("exist");

      // change the user details back to ACTIVATED
      cy.visit(confirmChangeActivationUrl(user_analyst_nc.email));
      cy.get("h1").contains("Reactivate").should("exist");
      cy.get('input[name="confirm"][value="Yes"]').click();
      cy.get("button").contains("Continue").click();
      // should get redirected to manage users page and alert should appear
      cy.get("h1", { timeout: 15 * 2000 })
        .contains("Manage users", { timeout: 15 * 2000 })
        .should("exist");
      cy.get("p span").contains(
        /automated-test analyst-user-change-role has been reactivated\./
      );
      // going to user details page and should see reactivation timestamp
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get("dt").contains("Reactivated").should("exist");
    });
  }
);

export {};
