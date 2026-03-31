import {
  expected_agreements,
  QA01_ID,
  setTestInductionCookie,
  user_analyst_c,
} from '../utils';

before(() => {
  cy.task('updateUserInductionStatus', {
    user_email: user_analyst_c.email,
    done_induction: true,
  });
  cy.visit('/'); // must visit a page first
  setTestInductionCookie({}, [], false, 'ANALYST');
});

describe('login and basic navigation', () => {
  it('Analyst user navigates through main menu', () => {
    //-------------------------------------------------------------------------------------------
    cy.log('Navigate to welcome page without logging in');
    //-------------------------------------------------------------------------------------------
    cy.visit('/');
    cy.get('button.nhsuk-button').contains('Sign in').should('be.visible');
    cy.get('h1').contains('Sign in').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Check content security policy and header option');
    //-------------------------------------------------------------------------------------------
    cy.request('GET', '/').then((response) => {
      expect(response.headers).to.have.property(
        'x-frame-options',
        'SAMEORIGIN',
      );
      expect(response.headers).to.have.property('content-security-policy');
      expect(response.headers['content-security-policy']).to.contain(
        "frame-ancestors 'none'",
      );
    });

    //-------------------------------------------------------------------------------------------
    cy.log('Log in as Analyst');
    //-------------------------------------------------------------------------------------------
    cy.full_login('ANALYST');
    cy.visit('/');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Check number of available agreements');
    //-------------------------------------------------------------------------------------------
    cy.get('tbody tr')
      .its('length')
      .should((len) => {
        const expected = expected_agreements[Cypress.env('BUILD_ENV')].length;

        if (len !== expected) {
          throw new Error(
            `Number of available agreements is incorrect: expected ${expected}, but found ${len}.`,
          );
        }
      });

    //-------------------------------------------------------------------------------------------
    cy.log('Select agreement and check page content');
    //-------------------------------------------------------------------------------------------
    cy.contains('tbody tr', QA01_ID.toUpperCase()).find('a').click();
    cy.get('[data-cy=manage-users-card]').should('not.exist');
    cy.get('[data-cy=launch-virtual-desktop-card').should('exist');
    cy.get('[data-cy=upload-ref-data-card]').should('exist');
    cy.get('[data-cy=help-card]').should('exist');
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('not.exist');
    cy.get('#change-agreement-bar').should('not.exist');
    cy.get('[data-cy=footer]').should('exist');
    cy.checkAccessibility('header');
    cy.checkAccessibility('footer');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Navigate to launch virtual desktop page and back again');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy=launch-virtual-desktop-card').click();
    cy.get('h1').contains('Confirm your agreement selection').should('exist');
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('not.exist');
    cy.get('#change-agreement-bar').should('not.exist');
    cy.get('[data-cy=go-back-link]').should('exist').click();

    //-------------------------------------------------------------------------------------------
    cy.log('Navigate to upload ref data page and back again');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy=upload-ref-data-card]').click();
    cy.get('h1').contains('Import reference data').should('exist');
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('not.exist');
    cy.get('#change-agreement-bar').should('not.exist');
    cy.get('[data-cy=go-back]').should('exist').click();

    //-------------------------------------------------------------------------------------------
    cy.log('Check that help and guidance link works');
    //-------------------------------------------------------------------------------------------
    cy.get<string>('a.nhsuk-card__link')
      .contains('guidance')
      .should('have.attr', 'href')
      .then((href) => {
        cy.request({ url: href, failOnStatusCode: false }).then((resp) => {
          expect(resp.status).to.not.eq(404);
        });
      });

    //-------------------------------------------------------------------------------------------
    cy.log('redirects if you try to go to the welcome page while logged in');
    //-------------------------------------------------------------------------------------------
    cy.visit('/welcome');
    cy.get('h1').contains('Access an agreement').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('Log out');
    //-------------------------------------------------------------------------------------------
    cy.visit('/');
    cy.get('input.nhsuk-button').contains('Logout').click();
    cy.get('h1').should('contain', 'You are logged out.');
    cy.checkAccessibility('main');
  });

  it('Error pages are accessible', () => {
    cy.full_login('ANALYST');
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

    Cypress.on('uncaught:exception', (err) => {
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
    cy.checkAccessibility('main');
  });
});

export {};
