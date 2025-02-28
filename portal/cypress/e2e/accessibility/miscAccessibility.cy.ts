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

describe("Accessibility - Pages before login", () => {
  it("Header is accessible", () => {
    cy.visit("/");
    cy.injectAxe();
    cy.checkA11y("header");
  });
  it("Footer is accessible", () => {
    cy.visit("/");
    cy.injectAxe();
    cy.checkA11y("footer");
  });
  it("Welcome page is accessible", () => {
    cy.visit("/");
    cy.get("title").contains("Welcome to the NHS Secure Data Environment");
    cy.injectAxe();
    cy.checkA11y("main");
  });
});

// for each of the error page tests, we need to also check for the page title/header
// to ensure have navigated to the correct error page and its not a legit error
describe("Accessibility - Error pages and logout", () => {
  beforeEach(() => {
    cy.full_login("ANALYST");
  });
  it("Logout page is accessible", () => {
    cy.visit("/");
    cy.get("input.nhsuk-button").contains("Logout").click();
    cy.get("h1").contains("You are logged out");

    cy.url().should("include", "logout_confirm");
    cy.injectAxe();
    cy.checkA11y("main");
  });
  it("Error 403 page is accessible", () => {
    cy.visit("/403", { failOnStatusCode: false });
    cy.get("title").contains("Method not allowed");
    cy.injectAxe();
    cy.checkA11y("main");
  });
  it("Error 404 page is accessible", () => {
    cy.visit("/404", { failOnStatusCode: false });
    cy.get("title").contains("Page Not Found");
    cy.injectAxe();
    cy.checkA11y("main");
  });
  it("Error 405 page is accessible", () => {
    cy.visit("/405", { failOnStatusCode: false });
    cy.get("title").contains("Error accessing page");
    cy.injectAxe();
    cy.checkA11y("main");
  });
  it("Error 500 page is accessible", () => {
    cy.visit("/500", { failOnStatusCode: false });
    cy.get("title").contains("Unexpected Error");
    cy.injectAxe();
    cy.checkA11y("main");
  });
});
