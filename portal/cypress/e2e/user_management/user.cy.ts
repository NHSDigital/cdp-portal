import {
  describe_only_if_manage_users_flag_enabled,
  setUserActivation,
  userDetailsUrl,
  user_analyst_nc,
  user_manager_nc,
  user_data_wrangler_nc,
  user_support_admin_nc,
} from "../utils";

//---------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]/manage-users/[user]"
//---------------------------------------------------------------------------

beforeEach(() => {});

describe_only_if_manage_users_flag_enabled(
  "User Details Page - Analyst tests",
  () => {
    beforeEach(() => {
      cy.full_login("ANALYST");
    });
    it("Analyst - cannot view page", () => {
      cy.visit(userDetailsUrl(user_analyst_nc.email), {
        failOnStatusCode: false,
      });
      // Analyst gets the missing permission error (403)
      cy.get("h1").contains("You do not have permission to access this page");
    });
  }
);

describe_only_if_manage_users_flag_enabled(
  "User Details Page - UserManager tests",
  () => {
    beforeEach(() => {
      cy.full_login("USER_MANAGER");
    });

    function check_non_role_specific_components() {
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get("p").contains("To update this user").should("exist");
      cy.get("dt").contains("Status").should("exist");
      cy.get("dt").contains("Email address").should("exist");
      cy.get("dt").contains("Role").should("exist");
      cy.get("summary").click();
      cy.get("td").contains("PENDING INDUCTION");
      cy.get("td").contains("User has been sent induction assessment");
      cy.get("td").contains("ACTIVATED");
      cy.get("td").contains("User has access to the SDE");
      cy.get("td").contains("DEACTIVATED");
      cy.get("td").contains("User account is temporarily closed");
    }

    it("Correctly displays information for an active Analyst", () => {
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_nc.email,
        done_induction: true,
      });
      setUserActivation(user_analyst_nc.email, true); // analyst is active
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      // verify we are on correct page
      cy.get("dd").contains("Data Analyst").should("exist");
      cy.get("h1").contains(user_analyst_nc.name).should("exist");
      // check page contains correct information
      check_non_role_specific_components();
      // role specific rows
      cy.get(`dd[data-cy="status"] strong`)
        .contains("ACTIVATED")
        .should("exist");
      cy.get("dt").contains("VDI memory size").should("exist");
      cy.get("dt").contains("Added to agreement").should("exist");
      cy.get("dt").contains("Last logged in").should("exist");
      cy.get("dt").contains("Induction assessment passed").should("exist");
    });

    it("Correctly displays information for an Analyst pending induction", () => {
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_nc.email,
        done_induction: false,
      });
      setUserActivation(user_analyst_nc.email, true); // analyst is not deactivated
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      // verify we are on correct page
      cy.get(`dd[data-cy="status"] strong`)
        .contains("PENDING INDUCTION")
        .should("exist");
      cy.get("dd").contains("Data Analyst").should("exist");
      cy.get("h1").contains(user_analyst_nc.name).should("exist");
      // check page contains correct information
      check_non_role_specific_components();
      // role specific rows
      cy.get("dt").contains("VDI memory size").should("exist");
      cy.get("dt").contains("Added to agreement").should("exist");
      cy.get("dt").contains("Last logged in").should("exist");
      cy.get("dt").contains("Induction assessment passed").should("not.exist");
    });

    it("Correctly displays information for a UserManager", () => {
      cy.visit(userDetailsUrl(user_manager_nc.email));
      // verify we are on correct page
      cy.get("dd").contains("User Manager").should("exist");
      cy.get("h1").contains(user_manager_nc.name).should("exist");
      // check page contains the correct information
      check_non_role_specific_components();
      // role specific rows
      cy.get("dt").contains("Added to agreement").should("exist");
      // cy.get("dt").contains("Induction assessment passed").should("exist");
    });

    it("Shows not found error message on invalid user ", () => {
      const invalid_url = userDetailsUrl(user_manager_nc.email) + "invalid";
      cy.visit(invalid_url, { failOnStatusCode: false });
      // Verify we are on error page
      cy.get("h1")
        .contains("You do not have permission to access this page")
        .should("exist");
    });

    it("Cannot access user details page for data wrangler or support admin", () => {
      cy.visit(userDetailsUrl(user_data_wrangler_nc.email));
      cy.get("h1")
        .contains("You do not have permission to access this page")
        .should("exist");
      cy.visit(userDetailsUrl(user_support_admin_nc.email));
      cy.get("h1")
        .contains("You do not have permission to access this page")
        .should("exist");
    });
  }
);

export {};
