import {
  agreementUrl,
  describe_only_if_manage_users_flag_enabled,
  QA01_ID,
  user_analyst_nc,
  userDetailsUrl,
} from '../utils';

//---------------------------------------------------------------------------------------------
// User Flow Test for the Navbar component
//---------------------------------------------------------------------------------------------

function checkForNavbarExpectedElements(
  expect_change_agreement_link: boolean,
  agreement_id: string = QA01_ID,
) {
  cy.get('#header-navigation')
    .contains('a', 'SDE Portal')
    .should('have.attr', 'href', `/agreement/${QA01_ID}`);
  cy.get('#header-navigation')
    .contains('a', 'Manage users')
    .should('have.attr', 'href', `/agreement/${QA01_ID}/manage-users`);
  cy.get('#change-agreement-bar')
    .contains('strong', 'Reference Number')
    .should('exist');
  cy.get('#change-agreement-bar')
    .contains(agreement_id.toUpperCase())
    .should('exist');
  expect_change_agreement_link
    ? cy
        .get('#change-agreement-bar')
        .contains('a', 'Change agreement')
        .should('exist')
        .and('have.attr', 'href', '/')
    : cy
        .get('#change-agreement-bar')
        .contains('a', 'Change agreement')
        .should('not.exist');
}

describe_only_if_manage_users_flag_enabled('Navbar flow', () => {
  it('User Manager navigates using the Navbar', () => {
    cy.full_login('USER_MANAGER');

    //-------------------------------------------------------------------------------------------
    cy.log('navbar and change agreement not present on SDE Portal page');
    //-------------------------------------------------------------------------------------------
    cy.visit(agreementUrl());
    cy.get('#header-navigation').should('not.exist');
    cy.get('#change-agreement-bar').should('not.exist');

    //-------------------------------------------------------------------------------------------
    cy.log('navbar + change agreement link present on Manage Users page');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="manage-users-card"] a').click();
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users`,
    );
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    checkForNavbarExpectedElements(true);

    //-------------------------------------------------------------------------------------------
    cy.log('navbar present on Add User page, no change agreement link');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="add-new-user').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user?form_id=`,
    );
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    checkForNavbarExpectedElements(false);

    //-------------------------------------------------------------------------------------------
    cy.log('navbar present on Confirm Delete page, no change agreement link');
    //-------------------------------------------------------------------------------------------
    cy.get('input[name="first_name"]').type('test');
    cy.get('input[name="last_name"]').type('test');
    cy.get('input[name="email"]').type('test@test.com');
    cy.get('input[name="email_confirm"]').type('test@test.com');
    cy.get(`input[name="role"][value="Both"]`).click();
    cy.get('button').contains('Continue').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user/confirm?form_id=`,
    );
    cy.contains('tr', 'test').find('a').contains('Delete').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user/confirm/delete-user?form_id=`,
    );
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    checkForNavbarExpectedElements(false);

    //-------------------------------------------------------------------------------------------
    cy.log('navbar present on User Details page, no change agreement link');
    //-------------------------------------------------------------------------------------------
    cy.visit(userDetailsUrl(user_analyst_nc.email));
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/user/${user_analyst_nc.email}`,
    );
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    checkForNavbarExpectedElements(false);

    //-------------------------------------------------------------------------------------------
    cy.log('Clicking Manage Users link takes you to Manage Users page');
    //-------------------------------------------------------------------------------------------
    cy.get('#header-navigation').contains('a', 'Manage users').click();
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users`,
    );

    //-------------------------------------------------------------------------------------------
    cy.log('Clicking SDE Portal link takes you to SDE Portal page');
    //-------------------------------------------------------------------------------------------
    cy.get('#header-navigation').contains('a', 'SDE Portal').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/agreement/${QA01_ID}`);

    //-------------------------------------------------------------------------------------------
    cy.log('Clicking Change Agreement takes you to Agreement Selector page');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="manage-users-card"] a').click();
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users`,
    );
    cy.get('#change-agreement-bar').contains('a', 'Change agreement').click();
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
  });
});

export {};
