import {
  inductionQuestionPageUrl,
  describe_only_if_induction_flag_enabled,
  inductionPassedPageUrl,
  inductionNotPassedPageUrl,
  inductionStartPageUrl,
} from "../utils";
import { INDUCTION_COOKIE_NAME } from "app/induction/consts";
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

describe_only_if_induction_flag_enabled(
  "Accessibility - Induction pages",
  () => {
    beforeEach(() => {
      cy.full_login("ANALYST");
    });
    it("Start page is accessible", () => {
      cy.visit(inductionStartPageUrl());
      cy.injectAxe();
      cy.checkA11y("main");
    });
    it("Single Answer Question page is accessible", () => {
      cy.visit(inductionQuestionPageUrl("1"));
      cy.injectAxe();
      cy.checkA11y("main");
    });
    it("Multi Answer Question page is accessible", () => {
      cy.visit(inductionQuestionPageUrl("7"));
      cy.injectAxe();
      cy.checkA11y("main");
    });
    it("Assessment passed is accessible", () => {
      cy.setCookie(INDUCTION_COOKIE_NAME, JSON.stringify({ passed: true }));
      cy.visit(inductionPassedPageUrl());
      cy.injectAxe();
      cy.checkA11y("main");
    });
    it("Assessment not passed is accessible", () => {
      cy.setCookie(INDUCTION_COOKIE_NAME, JSON.stringify({ wrong: [1, 2] }));
      cy.visit(inductionNotPassedPageUrl());
      cy.injectAxe();
      cy.checkA11y("main");
    });
  }
);

export {};
