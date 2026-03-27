import { maintenancePageUrl } from '../utils';

describe('Maintenance Mode Enabled Tests', () => {
  // Every E2E test file needs this, or else retries pass when they should fail
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  beforeEach(() => {});

  it('Redirects non-maintenance users to the maintenance page', () => {
    cy.full_login('ANALYST');
    cy.visit('/');
    cy.url().should('eq', Cypress.config('baseUrl') + maintenancePageUrl());
    cy.get('h1').contains('Service is unavailable').should('exist');
    cy.get('p')
      .contains(
        'This service is currently undergoing maintenance and will be available soon. This should not take more than a few hours.',
      )
      .should('exist');
  });

  it('Allows access for maintenance users', () => {
    cy.full_login('MAINTAINER');
    cy.visit('/');
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
    cy.get('h1').contains('Common Data Platform (CDP) Portal').should('exist');
  });

  it('Displays maintenance notice to all users', () => {
    cy.full_login('MAINTAINER');
    cy.visit(maintenancePageUrl());
    cy.get('h1').contains('Service is unavailable').should('exist');
    cy.get('p')
      .contains(
        'This service is currently undergoing maintenance and will be available soon. This should not take more than a few hours.',
      )
      .should('exist');
  });

  it('Cannot access password setup pages', () => {
    cy.visit('/confirm-email-address');
    cy.url().should('eq', Cypress.config('baseUrl') + maintenancePageUrl());
    cy.get('h1').contains('Service is unavailable').should('exist');

    cy.visit('/set-up-password');
    cy.url().should('eq', Cypress.config('baseUrl') + maintenancePageUrl());
    cy.get('h1').contains('Service is unavailable').should('exist');

    cy.visit('/link-expired');
    cy.url().should('eq', Cypress.config('baseUrl') + maintenancePageUrl());
    cy.get('h1').contains('Service is unavailable').should('exist');
  });
});
