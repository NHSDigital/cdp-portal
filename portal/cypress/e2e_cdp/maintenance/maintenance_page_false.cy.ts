import { maintenancePageUrl } from '../utils';

describe('Maintenance Mode Disabled Tests', () => {
  // Every E2E test file needs this, or else retries pass when they should fail

  beforeEach(() => {});

  it('Allows access when maintenance mode is disabled', () => {
    cy.full_login('ANALYST');
    cy.visit('/maintenance');
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
    cy.get('h1').contains('Access an agreement').should('exist');
  });

  it('Redirects maintenance URL when mode is disabled', () => {
    cy.full_login('ANALYST');
    cy.visit(maintenancePageUrl());
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });
});
