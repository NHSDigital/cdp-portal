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
    //
    // Cant access pages unless confirmed email
    //

    cy.visit("/set-up-password?id=123456");
    cy.get("h1")
      .contains("Sign in to the Secure Data Environment (SDE) Portal")
      .should("exist");

    cy.visit("/link-expired");
    cy.get("h1")
      .contains("Sign in to the Secure Data Environment (SDE) Portal")
      .should("exist");

    //
    // confirm-email-address page
    //

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

    //
    // link-expired page
    //

    // set guid with an expired timestamp
    const guid = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    cy.task("updateUserPasswordResetGuid", {
      guid,
      user_email: USER_PASSWORD_SETUP_FLOW.email,
      is_expired: true,
    });

    // reload page using generated guid
    cy.visit(`/confirm-email-address?id=${guid}`);
    cy.get("h1").contains("Confirm your email address").should("exist");

    // enter email and should get redirected to the link expird page
    cy.get('input[name="email_address"]')
      .clear()
      .type(USER_PASSWORD_SETUP_FLOW.email);
    cy.get("button").contains("Continue").click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/link-expired`);
    cy.get("h1").contains("Setup link expired").should("exist");

    // verify accessibility
    cy.injectAxe();
    cy.checkA11y("main");

    // press button to resend link and expect the confirmation alert to appear
    cy.get("button").contains("Request a new link").click();
    cy.get("[data-cy=success-message]", { timeout: 10000 }).contains(
      "Your email has been resent",
      { timeout: 10000 }
    );

    //
    // set-up-pasword page
    //

    // set guid to some random 6 digit number
    cy.task("updateUserPasswordResetGuid", {
      guid,
      user_email: USER_PASSWORD_SETUP_FLOW.email,
    });

    // reload page using valid guid
    cy.visit(`/confirm-email-address?id=${guid}`);
    cy.get("h1").contains("Confirm your email address").should("exist");

    // error - invalid email but valid guid
    cy.get('input[name="email_address"]')
      .clear()
      .type("filler" + USER_PASSWORD_SETUP_FLOW.email);
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
    cy.url().should(
      "eq",
      `${Cypress.config("baseUrl")}/set-up-password?id=${guid}`
    );
    cy.get("h1").contains("Set up password").should("exist");

    // verify accessibility
    cy.injectAxe();
    cy.checkA11y("main");

    // passwords dont match errors
    cy.get('input[name="enter_password"]').clear().type("a");
    cy.get('input[name="confirm_password"]').clear().type("b");
    cy.get("button").contains("Continue").click();
    cy.get("a").contains("Passwords must match").should("exist");
    cy.get("span").contains("Passwords must match").should("exist");

    // expect other errors to appear for invalid password
    const invalid_password_tests = [
      {
        pwd: "ABCDEFGHIJKL1*",
        error_message: "Password must have at least one lowercase letter",
      },
      {
        pwd: "abcdefghijkl1*",
        error_message: "Password must have at least one uppercase letter",
      },
      {
        pwd: "Abcdefghijkl*",
        error_message: "Password must have at least one number",
      },
      {
        pwd: "Abcdefghijkl1",
        error_message: "Password must contain at least one special character",
      },
      {
        pwd: "Abcdefghijkl1**",
        error_message: "Password cannot have repeating characters",
      },
    ];

    for (const test_case of invalid_password_tests) {
      cy.get('input[name="enter_password"]').clear().type(test_case["pwd"]);
      cy.get('input[name="confirm_password"]').clear().type(test_case["pwd"]);
      cy.get("button").contains("Continue").click();
      cy.get("a").contains(test_case["error_message"]).should("exist");
      cy.get("span").contains(test_case["error_message"]).should("exist");
    }
  });
});
