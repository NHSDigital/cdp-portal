import { expected_agreements, user_analyst_c } from "../utils";

before(() => {
  cy.task("updateUserInductionStatus", {
    user_email: user_analyst_c.email,
    done_induction: true,
  });
});

// Every E2E test file needs this, or else retries pass when they should fail
beforeEach(() => {});

describe(
  "tests before login",
  {
    retries: {
      runMode: 2,
      openMode: 1,
    },
  },
  () => {
    it("loads into the welcome page and welcome button exists", () => {
      cy.visit("/");
      cy.get("button.nhsuk-button.welcomeButton").should("be.visible");
    });

    it("has a working content security policy and header option", () => {
      cy.request("GET", "/").then((response) => {
        expect(response.headers).to.have.property(
          "x-frame-options",
          "SAMEORIGIN"
        );
        expect(response.headers).to.have.property("content-security-policy");
        expect(response.headers["content-security-policy"]).to.contain(
          "frame-ancestors 'none'"
        );
      });
    });
  }
);

describe(
  "test after login",
  {
    retries: {
      runMode: 2,
      openMode: 1,
    },
  },
  () => {
    beforeEach(() => {
      //logins into the portal and caches the cookies
      cy.visit("/");
      cy.full_login("ANALYST"); // see cypress/support/commands.ts
    });

    it("main portal page", () => {
      cy.visit("/");

      // page renders correctly
      cy.get("#content-header").contains("Logged in as");
      cy.contains("Logout").should("be.visible");
      cy.get("h1")
        .contains("Secure Data Environment (SDE) Portal")
        .should("exist");
      cy.get("p.nhsuk-lede-text", { timeout: 15000 }).should(
        "contain",
        "Below are the agreements you can access"
      );

      // correct ammount of radio buttons and all contain expected data
      cy.get("input[type='radio']")
        .its("length")
        .should("eq", expected_agreements[Cypress.env("BUILD_ENV")].length);

      for (
        let i = 0;
        i < expected_agreements[Cypress.env("BUILD_ENV")].length;
        i++
      ) {
        const agreement_id = expected_agreements[Cypress.env("BUILD_ENV")][i];

        cy.contains("form div div p", agreement_id.toUpperCase()).should(
          "exist"
        );
      }
    });

    it("logs out and renders logged out page", () => {
      cy.visit("/");

      cy.get("input.nhsuk-button").contains("Logout").click();
      cy.get("h1").should("contain", "You are logged out.");
      cy.get("p").should(
        "contain",
        "Please make sure to close any other tabs to ensure you are logged out completely."
      );
      cy.get("a").should("contain", "Go back to home");
    });

    it("renders the launch desktop page and returns to previous page", () => {
      const dsa_000000_qa01 = expected_agreements[Cypress.env("BUILD_ENV")][0];
      cy.visit("/");
      // clicks on the agreement from the main page
      cy.get(`input[value="${dsa_000000_qa01}"]`).click();
      cy.contains("button", "Continue").click();

      cy.contains("p", dsa_000000_qa01).should("exist");
      cy.get("a.nhsuk-card__link")
        .contains("Launch the virtual desktop")
        .should("be.visible")
        .click();

      cy.get("button.nhsuk-button")
        .contains("Launch the virtual desktop")
        .should("exist");
      cy.get("a.nhsuk-back-link__link").click();

      cy.url().should("be.equal", `${Cypress.config("baseUrl")}/`);
    });

    it("renders upload reference data page and returns to previous page", () => {
      const dsa_000000_qa01 = expected_agreements[Cypress.env("BUILD_ENV")][0];
      cy.visit("/");

      // clicks on the agreement from the main page
      cy.get(`input[value="${dsa_000000_qa01}"]`).click();
      cy.contains("button", "Continue").click();

      cy.get("a.nhsuk-card__link").contains("Upload reference data").click();
      cy.get("input[type='file']").should("exist", { timeout: 5000 });
      cy.get("a.nhsuk-back-link__link").click();

      cy.url().should(
        "be.equal",
        `${Cypress.config("baseUrl")}/agreement/${dsa_000000_qa01}`
      );
    });

    it("has a working help and guidance link", () => {
      const dsa_000000_qa01 = expected_agreements[Cypress.env("BUILD_ENV")][0];

      cy.visit("/");

      // clicks on the agreement from the main page
      cy.get(`input[value="${dsa_000000_qa01}"]`).click();
      cy.contains("button", "Continue").click();

      cy.get<string>("a.nhsuk-card__link")
        .contains("guidance")
        .should("have.attr", "href")
        .then((href) => {
          cy.request({ url: href, failOnStatusCode: false }).then((resp) => {
            expect(resp.status).to.not.eq(404);
          });
        });
    });

    it("renders the warning page and returns to main page", () => {
      const dsa_000000_qa01 = expected_agreements[Cypress.env("BUILD_ENV")][0];

      cy.visit("/");
      // clicks on the agreement from the main page
      cy.get(`input[value="${dsa_000000_qa01}"]`).click();
      cy.contains("button", "Continue").click();

      cy.get("a.nhsuk-card__link")
        .contains("Launch the virtual desktop")
        .click();

      cy.get("h1")
        .contains("Confirm your agreement selection")
        .should("be.visible");

      cy.get("div.nhsuk-warning-callout")
        .contains(
          "Switching agreements will close any open sessions, and any unsaved work will be lost."
        )
        .should("be.visible");

      cy.get("h2.nhsuk-warning-callout__label")
        .contains("Warning")
        .should("be.visible");

      cy.get("button.nhsuk-button")
        .contains("Launch the virtual desktop")
        .should("be.visible");

      cy.get("a.nhsuk-back-link__link")
        .should("contain.html", "Go back to home")
        .click();

      cy.url().should("be.equal", `${Cypress.config("baseUrl")}/`);
    });

    it("loads the appstream", () => {
      const dsa_000000_qa01 = expected_agreements[Cypress.env("BUILD_ENV")][0];

      cy.visit(`/agreement/${dsa_000000_qa01}/switchagreement`);

      cy.get("button.nhsuk-button")
        .contains("Launch the virtual desktop")
        .click();

      cy.get("h1").should(
        "have.text",
        `Loading agreement ${dsa_000000_qa01}...`
      );
      cy.get("a.nhsuk-back-link__link").should("have.text", "Go back");
    });

    it("renders loading page and back button returns to agreement", () => {
      const dsa_000000_qa01 = expected_agreements[Cypress.env("BUILD_ENV")][0];

      cy.visit(`/agreement/${dsa_000000_qa01}/switchagreement`);

      cy.get("button.nhsuk-button")
        .contains("Launch the virtual desktop")
        .click();

      cy.get("a.nhsuk-back-link__link").should("have.text", "Go back").click();
      cy.url().should(
        "be.equal",
        `${Cypress.config("baseUrl")}/agreement/${dsa_000000_qa01}`
      );
    });

    it("redirects you if you try to go to the welcome page", () => {
      cy.visit("/welcome");

      cy.url().should("be.equal", `${Cypress.config("baseUrl")}/`);
    });
  }
);

describe("support admin tests after login", () => {
  it("shows the support admin all expected agreements", () => {
    const filtered_agreements = expected_agreements[
      Cypress.env("BUILD_ENV")
    ].filter((id) => id.startsWith("dsa-"));

    cy.full_login("SUPPORT_ADMIN");
    cy.visit("/");

    cy.get("input[type='radio']")
      .its("length")
      .should("gte", filtered_agreements.length);

    for (let i = 0; i < filtered_agreements.length; i++) {
      const agreement_id = filtered_agreements[i];
      cy.contains("form div div p", agreement_id.toUpperCase()).should("exist");
    }

    const irrelevant_agreements = expected_agreements[
      Cypress.env("BUILD_ENV")
    ].filter((id) => !id.startsWith("dsa-"));

    irrelevant_agreements.forEach((id) => {
      cy.contains("form div div p", id.toUpperCase()).should("not.exist");
    });
  });
});

export {};
