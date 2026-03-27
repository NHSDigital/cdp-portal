import 'cypress-axe';

import { QA01_ID } from '../utils';

describe('Accessibility - Pages before login', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Header is accessible', () => {
    cy.checkAccessibility('header');
  });
  it('Footer is accessible', () => {
    cy.checkAccessibility('footer');
  });
  it('Welcome page is accessible', () => {
    cy.get('title').contains('Welcome to the NHS Secure Data Environment');
    cy.checkAccessibility('main');
  });
});

describe('Accessibility - Error pages and logout', () => {
  beforeEach(() => {
    cy.full_login('ANALYST');
  });

  it('Logout page is accessible', () => {
    cy.visit('/');

    cy.wait(150);
    cy.get('input.nhsuk-button').contains('Logout').click();
    cy.get('h1').contains('You are logged out');

    cy.url().should('include', 'logout_confirm');
    cy.checkAccessibility('main');
  });

  const errorPages = [
    {
      path: '/403',
      title: 'Method not allowed',
      header: 'You do not have permission to access this page',
    },
    { path: '/404', title: 'Page not found', header: 'Page not found' },
    {
      path: '/405',
      title: 'Error accessing page',
      header: 'Error accessing page',
    },
  ];

  errorPages.forEach(({ path, title, header }) => {
    it(`Error page ${path} is accessible`, () => {
      cy.visit(path, { failOnStatusCode: false });
      cy.title().should('include', title);
      cy.get('h1').should('contain', header);
      cy.checkAccessibility('main');
    });
  });

  it('Error 500 page is accessible', () => {
    Cypress.on('uncaught:exception', (err) => {
      // This test is expected to raise an error so ignore the one we're expecting
      if (err.message.includes('Failed to upload file to S3')) {
        return false;
      }
    });
    cy.intercept('POST', '/api/getfileuploadurl', {
      statusCode: 500,
      body: { message: 'File does not exist' },
    }).as('fake_file_exists_req');

    cy.visit(`/agreement/${QA01_ID}/fileupload`);
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('a,b\n1,2\n3,4'),
      fileName: 'valid.csv',
    });
    cy.get('button').contains('Continue to upload').click();
    cy.get('button').contains('Submit file').click();

    cy.get('h1').contains('Sorry, there is a problem with the service');
    cy.injectAxe();
  });
});
