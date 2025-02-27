import {
  describe_only_if_maintenance_flag_enabled,
  maintenancePageUrl,
} from "../utils";

describe("Maintenance Mode Disabled Tests", () => {
  beforeEach(() => {});

  it("Allows access when maintenance mode is disabled", () => {
    cy.full_login("ANALYST");
    cy.visit("/maintenance");
    cy.url().should("eq", Cypress.config("baseUrl") + "/");
    cy.get("h1")
      .contains("Secure Data Environment (SDE) Portal")
      .should("exist");
  });

  it("Redirects maintenance URL when mode is disabled", () => {
    cy.full_login("ANALYST");
    cy.visit(maintenancePageUrl());
    cy.url().should("eq", Cypress.config("baseUrl") + "/");
  });
});
