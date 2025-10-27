import { CookieNames } from '@/config/constants';

import {
  addUserUrl,
  describe_only_if_manage_users_flag_enabled,
  manageUsersUrl,
  QA01_ID,
} from '../utils';

//---------------------------------------------------------------------------------------------
// User Flow Test for the page "portal/app/agreement/[agreement_id]/manage-users/add-user"
//---------------------------------------------------------------------------------------------

const users = {
  user_1: {
    first_name: 'Marmaduke',
    last_name: 'Tootle',
    email: 'marmss@example.com',
    role: 'Analyst',
  },
  user_2: {
    first_name: 'Marcus',
    last_name: 'Decimus Meridius',
    email: 'marcusdecimusmeridius@example.com',
    role: 'Analyst',
  },
  user_3: {
    first_name: 'Luke',
    last_name: 'Skywalker',
    email: 'lukeskywalker@example.com',
    role: 'UserManager',
  },
};

function checkForAddUserExpectedElements() {
  cy.get('[data-cy=header]').should('exist');
  cy.get('[data-cy=footer]').should('exist');
  cy.get('[data-cy=go-back-link]')
    .contains('Go back')
    .should('have.attr', 'href', `/agreement/${QA01_ID}/manage-users`);
  cy.get('h1').contains('Add a new user').should('exist');
  cy.get('p')
    .contains(
      'We need some details about the user. You can add additional users later.',
    )
    .should('exist');
  cy.get('#first_name-label').contains('First name').should('exist');
  cy.get('input[name="first_name"]').should('exist');
  cy.get('#last_name-label').contains('Last name').should('exist');
  cy.get('input[name="last_name"]').should('exist');
  cy.get('#email-label').contains('Email').should('exist');
  cy.get('#email-hint')
    .contains(
      "This must be the user's correct work email, not a personal email address. For example - john.smith1@nhs.net",
    )
    .should('exist');
  cy.get('input[name="email"]').should('exist');
  cy.get('#email_confirm-label')
    .contains('Confirm their email')
    .should('exist');
  cy.get('input[name="email_confirm"]').should('exist');
  cy.get('fieldset[data-cy="role-select"]').within(() => {
    cy.contains('strong', 'Role').should('exist');
    cy.get('#role-Analyst-label').contains('Data Analyst').should('exist');
    cy.get('#role-Analyst-description')
      .should(
        'contain.text',
        'User can access data through the SDE platform. These users will be charged £435 a month per agreement.',
      )
      .find('strong')
      .should('have.text', '£435 a month');
    cy.get('input[name="role"][value="Analyst"]').should('exist');
    cy.get('#role-UserManager-label').contains('User Manager').should('exist');
    cy.get('#role-UserManager-description')
      .should(
        'contain.text',
        'User can add and manage other users on the SDE platform. User managers are not charged.',
      )
      .find('strong')
      .should('have.text', 'not charged.');
    cy.get('input[name="role"][value="UserManager"]').should('exist');
    cy.get('#role-Both-label').contains('Both').should('exist');
    cy.get('#role-Both-description')
      .should(
        'contain.text',
        'User can access data and manage other users on the SDE platform. These users will be charged £435 a month per agreement.',
      )
      .find('strong')
      .should('have.text', '£435 a month');
    cy.get('input[name="role"][value="Both"]').should('exist');
  });
  cy.get('[data-cy="submit-button').contains('Continue').should('exist');
}

function checkForConfirmPageExpectedElements() {
  cy.get('[data-cy=header]').should('exist');
  cy.get('[data-cy=footer]').should('exist');
  cy.get('[data-cy=go-back-link]')
    .contains('Go back')
    .should('have.attr', 'href')
    .and('include', `/agreement/${QA01_ID}/manage-users/add-user?form_id=`);
  cy.get('h1').contains('Confirm user details').should('exist');
  cy.get('[data-cy="user-details-table"]').should('exist');
  cy.get('[data-cy="add-another-user"]')
    .contains('a', 'Add another user')
    .should('have.attr', 'href')
    .and('include', `/agreement/${QA01_ID}/manage-users/add-user?form_id=`);
  cy.get('[data-cy="data-analyst-warning"]').should('exist');
  cy.get('#final_confirm-label').should('exist');
  cy.get('[data-cy=confirm-users-button]')
    .contains('Confirm users')
    .should('exist');
}

describe_only_if_manage_users_flag_enabled('Add User Flow', () => {
  it('User Manager adds new users', () => {
    cy.intercept('POST', '**/manage-users/add-user/confirm*', {
      statusCode: 200,
      body: { success: true },
    }).as('addUser');

    cy.full_login('USER_MANAGER');

    //-------------------------------------------------------------------------------------------
    cy.log('visit add user page, check for expected elements');
    //-------------------------------------------------------------------------------------------
    cy.clearCookie(CookieNames.ADD_USER_FORM);
    cy.visit(manageUsersUrl());
    cy.get('[data-cy=add-new-user').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}${addUserUrl()}?form_id=`,
    );
    checkForAddUserExpectedElements();

    //-------------------------------------------------------------------------------------------
    cy.log('try continuing with no data - errors shown');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="submit-button').contains('Continue').click();
    cy.get('#error-summary').within(() => {
      cy.contains('#error-summary-title', 'There is a problem').should('exist');
      cy.contains('a', 'Enter a first name').should('exist');
      cy.contains('a', 'Enter a last name').should('exist');
      cy.contains('a', 'Enter an email address').should('exist');
      cy.contains('a', 'Select a role').should('exist');
    });

    //-------------------------------------------------------------------------------------------
    cy.log('complete the form and submit');
    //-------------------------------------------------------------------------------------------
    cy.get('input[name="first_name"]').type(users.user_1.first_name);
    cy.get('input[name="last_name"]').type(users.user_1.last_name);
    cy.get('input[name="email"]').type(users.user_1.email);
    cy.get('input[name="email_confirm"]').type(users.user_1.email);
    cy.get(`input[name="role"][value="${users.user_1.role}"]`).click();
    cy.get('button').contains('Continue').click();

    //-------------------------------------------------------------------------------------------
    cy.log('check the confirm page');
    //-------------------------------------------------------------------------------------------')
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user/confirm?form_id=`,
    );
    checkForConfirmPageExpectedElements();
    cy.get('[data-cy="user-details-table"]')
      .contains(users.user_1.email)
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('edit the user - form is pre-populated');
    //-------------------------------------------------------------------------------------------
    cy.contains('tr', users.user_1.email).find('a').contains('Edit').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user/confirm?form_id=`,
    );
    cy.get('input[name="first_name"]').should(
      'have.value',
      users.user_1.first_name,
    );
    cy.get('input[name="last_name"]').should(
      'have.value',
      users.user_1.last_name,
    );
    cy.get('input[name="email"]').should('have.value', users.user_1.email);
    cy.get('input[name="email_confirm"]').should(
      'have.value',
      users.user_1.email,
    );
    cy.get(`input[name="role"][value="${users.user_1.role}"]`).should(
      'be.checked',
    );

    //-------------------------------------------------------------------------------------------
    cy.log('edit the user - first name updates on confirm page');
    //-------------------------------------------------------------------------------------------
    cy.get('input[name="first_name"]').type('edited');
    cy.get('button').contains('Continue').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user/confirm?form_id=`,
    );
    cy.get('h1').contains('Confirm user details').should('exist');
    cy.get('[data-cy="first-name-cell"]')
      .contains(`${users.user_1.first_name}edited`)
      .should('exist');
    cy.get('[data-cy="email-cell"]')
      .contains(users.user_1.email)
      .should('have.length', 1);

    //-------------------------------------------------------------------------------------------
    cy.log('deleting the only user causes redirect');
    //-------------------------------------------------------------------------------------------
    cy.contains('tr', users.user_1.email).find('a').contains('Delete').click();
    cy.get('h1')
      .contains(
        `Delete ${users.user_1.first_name}edited ${users.user_1.last_name}`,
      )
      .should('exist');
    cy.get('input[name="confirm"][value="no"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="email-cell"]')
      .contains(users.user_1.email)
      .should('have.length', 1);
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user/confirm?form_id=`,
    );
    cy.contains('tr', users.user_1.email).find('a').contains('Delete').click();
    cy.get('h1')
      .contains(
        `Delete ${users.user_1.first_name}edited ${users.user_1.last_name}`,
      )
      .should('exist');
    cy.get('button').contains('Continue').click();
    cy.get('#error-summary').within(() => {
      cy.contains('#error-summary-title', 'There is a problem').should('exist');
      cy.contains('a', 'Please select an option').should('exist');
    });
    cy.get('input[name="confirm"][value="yes"]').click();
    cy.get('button').contains('Continue').click();
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users`,
    );
    cy.get('h1').contains('Manage users').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('adding multiple users - first user');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="add-new-user"]').should('be.visible').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user?form_id`,
    );
    cy.get('h1')
      .contains('Add a new user', { timeout: 15 * 2000 })
      .should('exist');
    cy.get('input[name="first_name"]').type(users.user_1.first_name);
    cy.get('input[name="last_name"]').type(users.user_1.last_name);
    cy.get('input[name="email"]').type(users.user_1.email);
    cy.get('input[name="email_confirm"]').type(users.user_1.email);
    cy.get(`input[name="role"][value="${users.user_1.role}"]`).click();
    cy.get('button').contains('Continue').click();
    cy.url().should('include', '/add-user/confirm');
    cy.get('[data-cy="user-details-table"]')
      .contains(users.user_1.email)
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('adding multiple users - second user');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="add-another-user"]').should('be.visible').click();
    cy.url().should('include', '/add-user?form_id');
    cy.get('h1')
      .contains('Add a new user', { timeout: 15 * 2000 })
      .should('exist');
    cy.get('input[name="first_name"]').type(users.user_2.first_name);
    cy.get('input[name="last_name"]').type(users.user_2.last_name);
    cy.get('input[name="email"]').type(users.user_2.email);
    cy.get('input[name="email_confirm"]').type(users.user_2.email);
    cy.get(`input[name="role"][value="${users.user_2.role}"]`).click();
    cy.get('button').contains('Continue').click();
    cy.url().should('include', '/add-user/confirm');
    cy.get('[data-cy="user-details-table"]')
      .contains(users.user_2.email)
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('adding multiple users - third user');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="add-another-user"]').should('be.visible').click();
    cy.url().should('include', '/add-user?form_id');
    cy.get('h1')
      .contains('Add a new user', { timeout: 15 * 2000 })
      .should('exist');
    cy.get('input[name="first_name"]').type(users.user_3.first_name);
    cy.get('input[name="last_name"]').type(users.user_3.last_name);
    cy.get('input[name="email"]').type(users.user_3.email);
    cy.get('input[name="email_confirm"]').type(users.user_3.email);
    cy.get(`input[name="role"][value="${users.user_3.role}"]`).click();
    cy.get('button').contains('Continue').click();
    cy.url().should('include', '/add-user/confirm');
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length', 3);
    cy.get('[data-cy="user-details-table"]')
      .contains(users.user_3.email)
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('deleting user when multiple in list');
    //-------------------------------------------------------------------------------------------
    cy.contains('tr', users.user_1.email).find('a').contains('Delete').click();
    cy.get('h1')
      .contains(`Delete ${users.user_1.first_name} ${users.user_1.last_name}`)
      .should('exist');
    cy.get('input[name="confirm"][value="yes"]').click();
    cy.get('button').contains('Continue').click();
    cy.url().should(
      'include',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users/add-user/confirm?form_id=`,
    );
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length', 2);
    cy.get('table td:nth-child(1)').then(($cells) => {
      const remaining_users = $cells.toArray().map((cell) => cell.innerText);
      console.log(remaining_users);
      expect(remaining_users.length).to.eq(2);
      expect(remaining_users).not.to.include(users.user_1.first_name);
    });

    //-------------------------------------------------------------------------------------------
    cy.log('submitting users and checking for success message');
    //-------------------------------------------------------------------------------------------
    cy.get('input[name="final_confirm"]').click({ force: true });
    cy.get('button').contains('Confirm users').click();
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users`,
    );
    cy.get('h1').contains('Manage users');
    cy.get('p span').contains('2 users added successfully');
  });
});

export {};
