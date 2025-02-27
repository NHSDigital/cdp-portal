import {
  changeRoleUrl,
  describe_only_if_manage_users_flag_enabled,
  user_analyst_nc,
  user_manager_nc,
  setUserActivation,
  userDetailsUrl,
  user_data_wrangler_nc,
  user_support_admin_nc,
} from "../utils";

//---------------------------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]/manage-users/[user_id]/change-role"
//---------------------------------------------------------------------------------------------

beforeEach(() => {});

describe_only_if_manage_users_flag_enabled(
  "change user role tests - Analyst",
  () => {
    it("cannot view change user role page", () => {
      cy.full_login("ANALYST");
      cy.visit(changeRoleUrl(user_analyst_nc.email), {
        failOnStatusCode: false,
      });
      cy.get("h1").contains("You do not have permission to access this page");
    });
  }
);

describe_only_if_manage_users_flag_enabled(
  "change user role tests - UserManager",
  () => {
    beforeEach(() => {
      cy.full_login("USER_MANAGER");
    });

    function checkForChangeRoleExpectedElements() {
      cy.get("h1").contains("Change user role").should("exist");
      cy.get('input[name="role"][value="Analyst"]').should("exist");
      cy.get('input[name="role"][value="UserManager"]').should("exist");
      cy.get('input[name="role"][value="Both"]').should("exist");
      cy.get("button").contains("Confirm role").should("exist");
      cy.get("[data-cy=go-back-link]").contains("Go back").click();
    }

    it("Can navigate to change role page from user details page", () => {
      setUserActivation(user_analyst_nc.email, true);
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get(`[data-cy="change-role-link"]`).click();
      checkForChangeRoleExpectedElements();
    });

    it("can navigate to change user role page and appears correct", () => {
      cy.visit(changeRoleUrl(user_analyst_nc.email));
      checkForChangeRoleExpectedElements();
      cy.get("h1")
        .contains("automated-test analyst-user-change-role")
        .should("exist");
    });

    it("clicking continue without selecting option shows an error", () => {
      cy.visit(changeRoleUrl(user_analyst_nc.email));
      cy.get("button").contains("Confirm role").click();
      cy.get("a").contains("Select a role").should("exist");
    });

    it("can change an Analyst user into a User Manager (and back again)", () => {
      setUserActivation(user_analyst_nc.email, true);

      cy.visit(changeRoleUrl(user_analyst_nc.email));
      cy.get('input[name="role"][value="UserManager"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to User Manager",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]")
        .get("dd")
        .contains("User Manager")
        .should("exist");
      cy.get("[data-cy=change-role-link]").contains("Change").click();
      cy.get("h1").contains("Change user role").should("exist");
      cy.get('input[name="role"][value="Analyst"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to Analyst",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]").get("dd").contains("Analyst").should("exist");
    });

    it("can change an User Manager into an Analyst (and back again)", () => {
      setUserActivation(user_manager_nc.email, true);

      cy.visit(changeRoleUrl(user_manager_nc.email));
      cy.get('input[name="role"][value="Analyst"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to Analyst",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]").get("dd").contains("Analyst").should("exist");
      cy.get("[data-cy=change-role-link]").contains("Change").click();
      cy.get("h1").contains("Change user role").should("exist");
      cy.get('input[name="role"][value="UserManager"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to User Manager",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]").contains("User Manager").should("exist");
    });

    it("can change a User Manager into a user with Both roles (and back again)", () => {
      setUserActivation(user_manager_nc.email, true);

      cy.visit(changeRoleUrl(user_manager_nc.email));
      cy.get('input[name="role"][value="Both"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to both Analyst and User Manager",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]")
        .contains("Both (Data Analyst and User Manager)")
        .should("exist");
      cy.get("[data-cy=change-role-link]").contains("Change").click();
      cy.get("h1").contains("Change user role").should("exist");
      cy.get('input[name="role"][value="UserManager"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to User Manager",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]").contains("User Manager").should("exist");
    });

    it("can change an Analyst into a user with Both roles (and back again", () => {
      setUserActivation(user_analyst_nc.email, true);

      cy.visit(changeRoleUrl(user_analyst_nc.email));
      cy.get('input[name="role"][value="Both"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to both Analyst and User Manager",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]")
        .contains("Both (Data Analyst and User Manager)")
        .should("exist");
      cy.get("[data-cy=change-role-link]").contains("Change").click();
      cy.get("h1").contains("Change user role").should("exist");
      cy.get('input[name="role"][value="Analyst"]').click();
      cy.get("button").contains("Confirm role").click();
      cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
        "role has been changed to Analyst",
        { timeout: 10000 }
      );
      cy.get("[data-cy=role]").contains("Analyst").should("exist");
    });

    it("cannot access page if data wrangler or support admin", () => {
      cy.visit(changeRoleUrl(user_data_wrangler_nc.email));
      cy.get("h1")
        .contains("You do not have permission to access this page")
        .should("exist");
      cy.visit(changeRoleUrl(user_support_admin_nc.email));
      cy.get("h1")
        .contains("You do not have permission to access this page")
        .should("exist");
    });
  }
);
