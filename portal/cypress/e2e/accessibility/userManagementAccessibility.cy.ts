import {
  describe_only_if_manage_users_flag_enabled,
  manageUsersUrl,
  addUserUrl,
  userDetailsUrl,
  user_analyst_nc,
  confirmChangeActivationUrl,
  changeRoleUrl,
  setTestAddUserFormCookie,
  addUserConfirmUrl,
} from "../utils";
import "cypress-axe";

// Every E2E test file needs this, or else retries pass when they should fail
beforeEach(() => {});

// Important Note :
// All pages that rendered using the pages router are wrapped in the BasePage component
// this component includes the SkipLink component as the first element in each page, as it allows
// users with screen readers to skip to the main content of the page.
// However because of the way cypress-axe works, it will fail the test if it detects the SkipLink component
// as the first element in the page, because for accessibility ti believes the first element should be a header.
// To avoid this, we can check only the main content of the page, by passing the main content ref to the checkA11y function
// we can check the header and footer separately in other tests if needed.

describe_only_if_manage_users_flag_enabled(
  "Accessibility - User Management pages",
  () => {
    beforeEach(() => {
      cy.full_login("USER_MANAGER");
    });
    it("Header is accessible", () => {
      cy.visit(manageUsersUrl());
      cy.injectAxe();
      cy.checkA11y("header");
    });
    it("Footer is accessible", () => {
      cy.visit(manageUsersUrl());
      cy.injectAxe();
      cy.checkA11y("footer");
    });
    it("Manage users page is accessible", () => {
      cy.visit(manageUsersUrl());
      cy.injectAxe();
      cy.checkA11y();
    });
    it("Manage users page is accessible with success message", () => {
      cy.setCookie("manage_users_success_message", "My success message");
      cy.visit(manageUsersUrl());
      cy.get("p span").contains("My success message").should("exist");
      cy.injectAxe();
      cy.checkA11y();
    });
    it("Add user page is accessible", () => {
      cy.visit(addUserUrl());
      cy.injectAxe();
      cy.checkA11y();
    });
    it("Add user page with errors is accessible", () => {
      cy.visit(addUserUrl());
      cy.get("button").contains("Continue").click();
      cy.injectAxe();
      cy.checkA11y();
    });
    it("Add user confirm page is accessible", () => {
      cy.visit(addUserUrl());
      // populate form and navigate to next page
      setTestAddUserFormCookie(
        "Bob",
        "Ross",
        "bob.ross@example.com",
        "Analyst"
      );
      cy.visit(addUserConfirmUrl());
      cy.url().should("include", "/add-user/confirm");
      cy.get("h1")
        .contains("Confirm user details", { timeout: 15 * 2000 })
        .should("exist");
      // check the confirm user page
      cy.injectAxe();
      cy.checkA11y();
    });
    it("Delete user confirmation (from confirm user details) is accessible", () => {
      cy.visit(addUserUrl());
      // populate form and navigate to next page
      setTestAddUserFormCookie(
        "Bob",
        "Ross",
        "bob.ross@example.com",
        "Analyst"
      );
      cy.visit(addUserConfirmUrl());
      cy.url().should("include", "/add-user/confirm");
      cy.get("h1")
        .contains("Confirm user details", { timeout: 15 * 2000 })
        .should("exist");
      // check the confirm user page
      cy.get("a").contains("Delete").click().click();
      cy.url().should("include", "/add-user/confirm/delete");
      cy.injectAxe();
      cy.checkA11y();
    });
    it("User details page is accessible", () => {
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.injectAxe();
      cy.checkA11y();
    });
    it("Confirm change activation page is accessible", () => {
      cy.visit(confirmChangeActivationUrl(user_analyst_nc.email));
      cy.injectAxe();
      cy.checkA11y();
    });
    it("Change user role page is accessible", () => {
      cy.visit(changeRoleUrl(user_analyst_nc.email));
      cy.injectAxe();
      cy.checkA11y();
    });
  }
);

export {};
