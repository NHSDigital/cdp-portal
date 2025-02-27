/// <reference types="cypress" />

//
// Full login
//

// Each user type available must have a corresponding environment variable CYPRESS_${user_type}_TEST_CREDENTIALS
// Set this is ./scripts/cypress-open-local.sh and ./scripts/cypress-run.sh

Cypress.Commands.add("full_login", (user_type: AllowedUserType) => {
  if (Cypress.env("BUILD_ENV") === "local") {
    localLogin(user_type);
  } else {
    loginWithRemoteServer(user_type);
  }
});

export function getUserCredentials(user_type: AllowedUserType) {
  const baseCredentials = Cypress.env(`${user_type}_TEST_CREDENTIALS`);
  return {
    username: baseCredentials.username,
    email: baseCredentials.username,
    password: baseCredentials.password, // gitsecrets:ignore
  };
}

function localLogin(user_type: AllowedUserType) {
  cy.session(`local_login_${user_type}`, () => {
    const args = getUserCredentials(user_type);

    cy.visit("/");

    cy.get("button.nhsuk-button.welcomeButton").click();
    cy.origin(
      Cypress.env("KEYCLOAK_HOSTNAME"),
      { args },
      ({ username, password }) => {
        cy.get("input#username").type(username);
        cy.get("input#password").type(password, {
          parseSpecialCharSequences: false,
        });
        cy.get("#kc-login").click();
      }
    );
    cy.get("button.button").click();
    cy.get("#content-header").contains("Logged in");
  });
}

function loginWithRemoteServer(user_type: AllowedUserType) {
  cy.session(`full_login_${user_type}`, () => {
    const { username, password } = getUserCredentials(user_type);

    cy.visit("/");

    cy.get("button.nhsuk-button.welcomeButton").click();

    cy.get("input#username").type(username);
    cy.get("input#password").type(password, {
      parseSpecialCharSequences: false,
    });
    cy.get("#kc-login").click();

    cy.get("#content-header").contains("Logged in");
  });
}

export {};
