import { CHECKBOX_FILTERS } from "app/agreement/[agreement_id]/manage-users/consts";
import {
  confirmChangeActivationUrl,
  describe_only_if_manage_users_flag_enabled,
  user_analyst_nc,
  manageUsersUrl,
  userDetailsUrl,
  user_manager_nc,
  user_manager_c,
  setUserActivation,
  user_data_wrangler_nc,
  user_support_admin_nc,
} from "../utils";

//---------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]/manage-users"
//---------------------------------------------------------------------------

beforeEach(() => {});

describe_only_if_manage_users_flag_enabled(
  "manage-users page tests - Analyst",
  () => {
    it("cannot view page", () => {
      cy.full_login("ANALYST");
      cy.visit(manageUsersUrl(), {
        failOnStatusCode: false,
      });
      // Analyst gets the missing permission error (403)
      cy.get("h1").contains("You do not have permission to access this page");
    });
  }
);

function userInManageUsersTableShould(user_email: string, should: string) {
  cy.get(
    `section[aria-label="User list"] tr a[href="${userDetailsUrl(user_email)}"]`
  ).should(should);
}

function textSearch(query: string) {
  cy.get("input#user-search-input").type(query);
  cy.get("search button").contains("Search").click();
  // When the a tag below has loaded, then we know the page has finished loading
  // Important to have the below to stop cypress detecting elements before the page
  // has finished updating
  cy.get(`search a[aria-label="Remove ${query.trim()}"]`).should("exist");
}

function addCheckboxFilter(filter_group: string, filter_value: string) {
  cy.get(`input[name="${filter_group}"][value="${filter_value}"]`).click();
  const filter_name = CHECKBOX_FILTERS.find(
    (filter) => filter.id == filter_group
  )?.options.find((opt) => opt.id == filter_value)?.name;
  if (!filter_name) throw new Error("The filter group and value wasn't valid");
  cy.get(`a[aria-label="Remove ${filter_name}"]`).should("exist");
}

describe_only_if_manage_users_flag_enabled(
  "manage-users page tests - UserManager",
  () => {
    beforeEach(() => {
      cy.full_login("USER_MANAGER");
      cy.visit(manageUsersUrl());
    });

    describe("Misc tests", () => {
      it("can view page and users", () => {
        cy.get("h1").contains("Manage users");
        cy.get("[data-cy=agreement_name]").should("exist");
        cy.get("tr a").contains(user_analyst_nc.name).should("exist");
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
      });

      it("Status key is present at bottom of page", () => {
        cy.get("[data-cy=status_key]").contains("What do these statuses mean?")
          .click;
        cy.get("[data-cy=status_key_table").should("be.visible");
      });

      it("success banner disappears", () => {
        cy.full_login("USER_MANAGER");
        cy.visit(confirmChangeActivationUrl(user_analyst_nc.email));
        cy.get("h1").contains("activate").should("exist");
        cy.get('input[name="confirm"][value="Yes"]').click();
        cy.get("button").contains("Continue").click();
        cy.get("h1", { timeout: 15 * 2000 })
          .contains("Manage users", { timeout: 15 * 2000 })
          .should("exist");
        cy.get("p span").contains(
          /automated-test analyst-user-change-role has been (de|re)activated\./
        );
        cy.get("a").contains("automated-test analyst-user-change-role").click();
        cy.get("p").contains("To update this user").should("exist");
        cy.get("a").contains("Go back").click();
        cy.get("h1").contains("Manage users").should("exist");
        cy.get("[data-cy=success-banner]", { timeout: 10000 }).should(
          "not.exist"
        );
      });
    });

    describe("Search and filter", () => {
      it("can search for users by name", () => {
        cy.get("tr a").contains(user_manager_nc.name).should("exist");
        cy.get("input#user-search-input").type(user_analyst_nc.name);
        cy.get("search button").contains("Search").click();
        cy.get("tr a").contains(user_manager_nc.name).should("not.exist");
        cy.get("tr a").contains(user_analyst_nc.name).should("exist");
      });

      it("can search by email", () => {
        // user_manager_c is nhs.net
        // user_manager_nc is example.com
        // ergo only user_manager_c will disappear in the search
        userInManageUsersTableShould(user_manager_c.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");
        textSearch("@example.com");
        userInManageUsersTableShould(user_manager_c.email, "not.exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");
      });

      it("message shown when no results", () => {
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        textSearch("very-specific-text-that-doesnt-exist");
        userInManageUsersTableShould(user_analyst_nc.email, "not.exist");
        cy.get("h2").contains("0 results found").should("exist");
      });

      it("overall clear filters works", () => {
        userInManageUsersTableShould(user_analyst_nc.email, "exist");

        addCheckboxFilter("role", "analyst");
        addCheckboxFilter("status", "activated");

        textSearch("very-specific-text-that-doesnt-exist");

        userInManageUsersTableShould(user_analyst_nc.email, "not.exist");
        cy.get("h2").contains("0 results found").should("exist");
        cy.contains("Selected filters").should("exist");

        // when we click the full clear button, our user should reappear in the list
        // the "Selected filters" heading should disappear
        cy.get("search a").contains("Clear").click();
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        cy.contains("Selected filters").should("not.exist");
      });

      it("clear text search filter works", () => {
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");

        addCheckboxFilter("role", "analyst");

        textSearch("very-specific-text-that-doesnt-exist");

        // now our user should not exist and we should get 0 results, and we should see selected filters
        userInManageUsersTableShould(user_analyst_nc.email, "not.exist");
        userInManageUsersTableShould(user_manager_nc.email, "not.exist");
        cy.get("h2").contains("0 results found").should("exist");
        cy.contains("Selected filters").should("exist");

        // we click remove the text filter
        cy.get(
          'a[aria-label="Remove very-specific-text-that-doesnt-exist"]'
        ).click();

        // our analyst user should be back, but not our user manager user
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "not.exist");

        // We should still have some other filters selected
        cy.contains("Selected filters").should("exist");
      });

      it("clear text search filter works with spaces in name", () => {
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");

        addCheckboxFilter("role", "analyst");

        textSearch(" very-specific-text-that-doesnt-exist ");

        // now our user should not exist and we should get 0 results, and we should see selected filters
        userInManageUsersTableShould(user_analyst_nc.email, "not.exist");
        userInManageUsersTableShould(user_manager_nc.email, "not.exist");
        cy.get("h2").contains("0 results found").should("exist");
        cy.contains("Selected filters").should("exist");

        // we click remove the text filter
        cy.get(
          'a[aria-label="Remove very-specific-text-that-doesnt-exist"]'
        ).click();

        // our analyst user should be back, but not our user manager user
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "not.exist");

        // We should still have some other filters selected
        cy.contains("Selected filters").should("exist");
      });

      it("add user button click redirects to add-user page", () => {
        // Clicking the add user button should redirect to the add-user page
        cy.get("a[href*='add-user']").click();
        cy.get("h1").contains("Add a new user");
      });

      it("can search based on role", () => {
        // check expected user there
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");

        addCheckboxFilter("role", "analyst");

        // our analyst user should be there, but not our user manager user
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "not.exist");

        // we click remove on the analyst filter
        cy.get('a[aria-label="Remove Data Analyst"]').click();
        cy.contains("Selected filters").should("not.exist");

        addCheckboxFilter("role", "user-manager");

        // our user manager should be there, but not our analyst
        userInManageUsersTableShould(user_analyst_nc.email, "not.exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");
      });

      it("can search based on activated/deactivated", () => {
        cy.task("updateUserInductionStatus", {
          user_email: user_analyst_nc.email,
          done_induction: true,
        });
        setUserActivation(user_analyst_nc.email, true); // analyst is active
        setUserActivation(user_manager_nc.email, false); // UM is not

        cy.visit(manageUsersUrl());

        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");

        addCheckboxFilter("status", "activated");

        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "not.exist");

        // we click remove on the active filter
        cy.get('a[aria-label="Remove Activated"]').click();
        cy.contains("Selected filters").should("not.exist");

        addCheckboxFilter("status", "deactivated");

        // our user manager should be there, but not our analyst
        userInManageUsersTableShould(user_analyst_nc.email, "not.exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");

        // Set this back to true to reduce risk of problems in other tests
        setUserActivation(user_manager_nc.email, true);
      });

      it("can search based on pending induction", () => {
        cy.task("updateUserInductionStatus", {
          user_email: user_analyst_nc.email,
          done_induction: false,
        });
        setUserActivation(user_analyst_nc.email, true); // analyst is active
        setUserActivation(user_manager_nc.email, true); // UM is active

        cy.visit(manageUsersUrl());

        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "exist");

        addCheckboxFilter("status", "pending-induction");

        userInManageUsersTableShould(user_analyst_nc.email, "exist");
        userInManageUsersTableShould(user_manager_nc.email, "not.exist");

        cy.task("updateUserInductionStatus", {
          user_email: user_analyst_nc.email,
          done_induction: true,
        });
      });

      it("can not view Data Wrangler and Support Admins", () => {
        userInManageUsersTableShould(user_data_wrangler_nc.email, "not.exist");
        userInManageUsersTableShould(user_support_admin_nc.email, "not.exist");
        userInManageUsersTableShould(user_analyst_nc.email, "exist");
      });
    });
  }
);
