import "cypress-axe";

const SHOULD_DO_PASSWORD_SETUP_TESTS = ["local", "dev", "test"].includes(
  Cypress.env("BUILD_ENV")
);
const USER_PASSWORD_SETUP_FLOW = {
  email: "portal.cypress.test-password-setup@example.com",
  name: "Portal Password Testing",
};
const describe_only_if_password_setup_enabled = SHOULD_DO_PASSWORD_SETUP_TESTS
  ? describe
  : describe.skip;

describe_only_if_password_setup_enabled("Password setup flow tests", () => {
  it("full e2e", () => {
    // load page and ensure on correct page
    cy.visit("/confirm-email-address?id=123456");
    cy.get("h1").contains("Confirm your email address").should("exist");

    // verify accessibility
    cy.injectAxe();
    cy.checkA11y("main");

    // error - if no input
    cy.get("button").contains("Continue").click();
    cy.get("a").contains("Enter your email address").should("exist");
    cy.get("span").contains("Enter your email address").should("exist");

    // error - invalid email
    cy.get('input[name="email_address"]').type("1");
    cy.get("button").contains("Continue").click();
    cy.get("a")
      .contains("This is not a valid email")
      .should("exist", { timeout: 10000 });
    cy.get("span").contains("This is not a valid email").should("exist");

    // error - valid email but invalid guid
    cy.get('input[name="email_address"]').clear();
    cy.get('input[name="email_address"]').type(USER_PASSWORD_SETUP_FLOW.email);
    cy.get("button").contains("Continue").click();
    cy.get("a")
      .contains("Enter the email address used to set up your account")
      .should("exist");
    cy.get("span")
      .contains("Enter the email address used to set up your account")
      .should("exist");

    // set set guid to some random 6 digit number
    const guid = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    cy.task("updateUserPasswordResetGuid", {
      guid,
      user_email: USER_PASSWORD_SETUP_FLOW.email,
    });

    // relaod page using valid guid
    cy.visit(`/confirm-email-address?id=${guid}`);
    cy.url().should(
      "eq",
      `${Cypress.config("baseUrl")}/confirm-email-address?id=${guid}`
    );
    cy.get("h1").contains("Confirm your email address").should("exist");

    // error - invalid email but valid guid
    cy.get('input[name="email_address"]').clear();
    cy.get('input[name="email_address"]').type(
      "filler" + USER_PASSWORD_SETUP_FLOW.email
    );
    cy.get("button").contains("Continue").click();
    cy.get("a")
      .contains("Enter the email address used to set up your account")
      .should("exist");
    cy.get("span")
      .contains("Enter the email address used to set up your account")
      .should("exist");

    // success - correct email and guid redirects to /set-up-password
    cy.get('input[name="email_address"]').clear();
    cy.get('input[name="email_address"]').type(USER_PASSWORD_SETUP_FLOW.email);
    cy.get("button").contains("Continue").click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/set-up-password`);
    cy.get("h1").contains("Set up password").should("exist");

    // verify accessibility
    cy.injectAxe();
    cy.checkA11y("main");
  });
});
