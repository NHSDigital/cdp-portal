import {
  describe_only_if_induction_flag_enabled,
  user_analyst_c,
  inductionStartPageUrl,
  agreementUrl,
  switchAgreementUrl,
} from "../utils";

// Every E2E test file needs this, or else retries pass when they should fail
beforeEach(() => {});

describe_only_if_induction_flag_enabled(
  "User with induction passed see home page",
  () => {
    beforeEach(() => {
      cy.full_login("ANALYST");
    });

    it("has basic expected components", () => {
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: true,
      });
      cy.visit("/");
      cy.get("p.nhsuk-lede-text", { timeout: 15000 }).should(
        "contain",
        "Below are the agreements you can access"
      );
      cy.url().should("eq", Cypress.config("baseUrl") + "/");
    });
  }
);

describe_only_if_induction_flag_enabled(
  "User without induction passed gets redirected to the induction page",
  () => {
    beforeEach(() => {
      cy.full_login("ANALYST");
    });

    it("User without induction passed gets redirected to the induction page when logins", () => {
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: false,
      });
      cy.visit("/");
      cy.get("h1").contains("Complete the induction assessment");
      cy.get("a").contains("Continue");
      cy.url().should(
        "eq",
        Cypress.config("baseUrl") + inductionStartPageUrl()
      );
    });

    it("User without induction passed gets redirected to the induction page from agreement page", () => {
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: true,
      });
      cy.visit(agreementUrl());
      cy.contains(
        "Access guidance on setting up your account and getting started with the tools"
      ).should("exist");
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: false,
      });
      cy.reload();
      cy.get("h1").contains("Complete the induction assessment");
      cy.get("a").contains("Continue");
      cy.url().should(
        "eq",
        Cypress.config("baseUrl") + inductionStartPageUrl()
      );
    });

    it("User without induction passed gets redirected to the induction page from switch agreement page", () => {
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: true,
      });
      cy.visit(switchAgreementUrl());
      cy.contains("Confirm your agreement selection").should("exist");
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: false,
      });
      cy.reload();
      cy.get("h1").contains("Complete the induction assessment");
      cy.get("a").contains("Continue");
      cy.url().should(
        "eq",
        Cypress.config("baseUrl") + inductionStartPageUrl()
      );
    });
  }
);

describe_only_if_induction_flag_enabled(
  "Redirects from induction page to home",
  () => {
    it("User who already passed induction gets redirected away from the induction page", () => {
      cy.full_login("ANALYST");
      cy.task("updateUserInductionStatus", {
        user_email: user_analyst_c.email,
        done_induction: true,
      });
      cy.visit("/induction");
      cy.get("h1")
        .contains("Secure Data Environment (SDE) Portal")
        .should("exist");
    });

    it("User manager (no induction needed) gets redirected away from the induction page", () => {
      cy.full_login("USER_MANAGER");
      cy.visit("/induction");
      cy.get("h1")
        .contains("Secure Data Environment (SDE) Portal")
        .should("exist");
    });
  }
);
