import { add } from "cypress/types/lodash";
import {
  describe_only_if_manage_users_flag_enabled,
  QA01_ID,
  agreementUrl,
  manageUsersUrl,
  addUserUrl,
  userDetailsUrl,
  user_analyst_nc,
} from "../utils";

//---------------------------------------------------------------------------
// Tests for the Navbar
//---------------------------------------------------------------------------

beforeEach(() => {});

describe_only_if_manage_users_flag_enabled("Navbar tests", () => {
  beforeEach(() => {
    cy.full_login("USER_MANAGER");
  });

  function validate_navbar(
    expect_change_agreement_link: boolean,
    agreement_id: string = QA01_ID
  ) {
    // check both navbars appear
    cy.get("header").get("nav").contains("SDE Portal").should("exist");
    cy.get("header").get("nav").contains("Reference Number").should("exist");
    // verify navbar displays current agreement
    cy.get("header")
      .get("nav")
      .contains(agreement_id.toUpperCase())
      .should("exist");

    cy.get("header")
      .get("nav")
      .contains("Change agreement")
      .should(expect_change_agreement_link ? "exist" : "not.exist");
  }

  it("Navbar is not displayed on old pages", () => {
    cy.visit(agreementUrl());
    cy.get("header").get("nav").should("not.exist");
  });
  it("Page selector and Change agreement bars across new pages", () => {
    // only expect to see the change agreement link on the manage users page
    let expect_change_agreement_link = true;
    cy.visit(manageUsersUrl());
    validate_navbar(expect_change_agreement_link);

    // for remaining pages we do not expect to see the link
    expect_change_agreement_link = false;
    cy.visit(addUserUrl());
    validate_navbar(expect_change_agreement_link);

    cy.visit(userDetailsUrl(user_analyst_nc.email));
    validate_navbar(expect_change_agreement_link);
  });
  it("Navbar links redirect to correct pages", () => {
    const base_url = Cypress.config("baseUrl");
    // SDE Portal link to panel page
    cy.visit(manageUsersUrl());
    cy.get("header").get("nav").contains("SDE Portal").click();
    cy.url().should("eq", `${base_url}/agreement/${QA01_ID}`);

    // Manage Users link to manage users page
    cy.visit(addUserUrl());
    cy.get("header").get("nav").contains("Manage users").click();
    cy.url().should("eq", `${base_url}/agreement/${QA01_ID}/manage-users`);

    // Change agreement link to agreement selector
    cy.visit(manageUsersUrl());
    cy.get("header").get("nav").contains("Change agreement").click();
    cy.url().should("eq", `${base_url}/`);
  });
});

export {};
