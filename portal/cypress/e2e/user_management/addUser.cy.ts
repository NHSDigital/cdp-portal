import { CookieNames } from '@/config/constants';

import {
  agreementUrl,
  describe_only_if_manage_users_flag_enabled,
  manageUsersUrl,
  setTestInductionCookie,
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

before(() => {
  cy.visit('/'); // must visit a page first
  setTestInductionCookie({}, [], false, 'ANALYST');
});

describe_only_if_manage_users_flag_enabled('Add User Flow', () => {
  it('User Manager adds new users', () => {
    cy.intercept('POST', '**/manage-users/add-user/confirm*', {
      statusCode: 200,
      body: { success: true },
    }).as('addUser');

    cy.full_login('USER_MANAGER');
    cy.clearCookie(CookieNames.ADD_USER_FORM);

    //-------------------------------------------------------------------------------------------
    cy.log('Navigate to add user page, check header and footer along the way');
    //-------------------------------------------------------------------------------------------

    cy.visit(agreementUrl());
    cy.get('[data-cy=manage-users-card]').should('exist');
    cy.get('[data-cy=launch-virtual-desktop-card').should('not.exist');
    cy.get('[data-cy=upload-ref-data-card]').should('not.exist');
    cy.get('[data-cy=help-card]').should('exist');
    cy.get('[data-cy=manage-users-card]').should('exist').click();
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    cy.get('[data-cy=footer]').should('exist');
    cy.get('[data-cy="add-new-user"]').should('exist').click();
    cy.get('[data-cy="add-user-form"]').should('exist');
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    cy.get('[data-cy=footer]').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('try continuing with no data - errors shown');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="submit-button').contains('Continue').click();
    cy.get('[data-cy="error-summary"]').should('exist');
    cy.checkAccessibility('main');

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
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    cy.checkAccessibility('main');
    cy.get('[data-cy="user-details-table"]')
      .contains(users.user_1.email)
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('edit the user - form is pre-populated');
    //-------------------------------------------------------------------------------------------
    cy.contains('tr', users.user_1.email).find('a').contains('Edit').click();
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
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    cy.get('[data-cy=footer]').should('exist');
    cy.checkAccessibility('main');
    cy.get('input[name="confirm"][value="no"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="email-cell"]')
      .contains(users.user_1.email)
      .should('have.length', 1);
    cy.contains('tr', users.user_1.email).find('a').contains('Delete').click();
    cy.get('h1')
      .contains(
        `Delete ${users.user_1.first_name}edited ${users.user_1.last_name}`,
      )
      .should('exist');
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="error-summary"]').should('exist');
    cy.get('input[name="confirm"][value="yes"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('h1').contains('Manage users').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('adding multiple users - first user');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="add-new-user"]').should('be.visible').click();
    cy.get('h1').contains('Add a new user').should('exist');
    cy.get('input[name="first_name"]').type(users.user_1.first_name);
    cy.get('input[name="last_name"]').type(users.user_1.last_name);
    cy.get('input[name="email"]').type(users.user_1.email);
    cy.get('input[name="email_confirm"]').type(users.user_1.email);
    cy.get(`input[name="role"][value="${users.user_1.role}"]`).click();
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="user-details-table"]')
      .contains(users.user_1.email)
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('adding multiple users - second user');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="add-another-user"]').should('be.visible').click();
    cy.get('h1').contains('Add a new user').should('exist');
    cy.get('input[name="first_name"]').type(users.user_2.first_name);
    cy.get('input[name="last_name"]').type(users.user_2.last_name);
    cy.get('input[name="email"]').type(users.user_2.email);
    cy.get('input[name="email_confirm"]').type(users.user_2.email);
    cy.get(`input[name="role"][value="${users.user_2.role}"]`).click();
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="user-details-table"]')
      .contains(users.user_2.email)
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('adding multiple users - third user');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy="add-another-user"]').should('be.visible').click();
    cy.get('h1').contains('Add a new user').should('exist');
    cy.get('input[name="first_name"]').type(users.user_3.first_name);
    cy.get('input[name="last_name"]').type(users.user_3.last_name);
    cy.get('input[name="email"]').type(users.user_3.email);
    cy.get('input[name="email_confirm"]').type(users.user_3.email);
    cy.get(`input[name="role"][value="${users.user_3.role}"]`).click();
    cy.get('button').contains('Continue').click();
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
    cy.visit(manageUsersUrl());
    cy.get('h1', { timeout: 30000 }).contains('Manage users');
    cy.get('p span').contains('2 users added successfully');
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
  });
});

export {};
