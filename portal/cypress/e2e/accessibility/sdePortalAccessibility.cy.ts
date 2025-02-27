import { QA01_ID } from "../utils";
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

describe("Accessibility - SDE Portal pages", () => {
  beforeEach(() => {
    cy.full_login("ANALYST");
  });
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
  it("Agreement selector page is accessible", () => {
    cy.visit("/");
    cy.get("title").contains(
      "Home - Select Agreement - NHS Secure Data Environment"
    );
    cy.injectAxe();
    cy.checkA11y("main");
  });
  it("Agreement page is accessible", () => {
    cy.visit(`/agreement/${QA01_ID}`);
    cy.get("title").contains(`SDE Portal`);
    cy.injectAxe();
    cy.checkA11y("main");
  });
  it("Switch agreement page is accessible", () => {
    cy.visit(`/agreement/${QA01_ID}/switchagreement`);
    cy.get("title").contains("Confirm Agreement - SDE");
    cy.injectAxe();
    cy.checkA11y("main");
  });
  it("Fileupload page is accessible", () => {
    cy.visit(`/agreement/${QA01_ID}/fileupload`);
    cy.get("title").contains(`Upload file to ${QA01_ID} - SDE`);
    cy.injectAxe();
    cy.checkA11y("main");
  });
});

export {};
