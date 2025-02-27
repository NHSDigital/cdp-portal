import {
  agreementUrl,
  describe_only_if_manage_users_flag_enabled,
  manageUsersUrl,
  user_analyst_c,
} from "../utils";

//---------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]"
//---------------------------------------------------------------------------

beforeEach(() => {});

describe_only_if_manage_users_flag_enabled(
  "agreement page tests for Analyst",
  () => {
    beforeEach(() => {
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: true,
      });
      cy.full_login("ANALYST");
      cy.visit(agreementUrl());
    });

    it("Analyst - can see Launch the virtual desktop", () => {
      cy.contains("Launch the virtual desktop").should("exist");
    });
    it("Analysts - can see Upload reference data", () => {
      cy.contains("Upload reference data").should("exist");
    });
    it("Analysts - cannot see manage users panel", () => {
      cy.contains("Manage users").should("not.exist");
    });
  }
);

describe_only_if_manage_users_flag_enabled(
  "agreement page tests for User Manager",
  () => {
    beforeEach(() => {
      cy.full_login("USER_MANAGER");
      cy.visit(agreementUrl());
    });

    it("UserManager - cannot see Launch the virtual desktop", () => {
      cy.contains("Launch the virtual desktop").should("not.exist");
    });
    it("UserManager - cannot see Upload reference data", () => {
      cy.contains("Upload reference data").should("not.exist");
    });
    it("UserManager - can access manage users page", () => {
      cy.contains("Manage users").should("exist");
    });
  }
);

export {};
