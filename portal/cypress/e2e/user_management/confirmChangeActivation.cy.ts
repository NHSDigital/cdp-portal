import {
  describe_only_if_manage_users_flag_enabled,
  manageUsersUrl,
  QA01_ID,
  setUserActivation,
  setUserRole,
  user_analyst_nc,
  userDetailsUrl,
  userInManageUsersTableShould,
} from '../utils';

//-----------------------------------------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]/manage-users/[user_id]/confirm-change-activation"
//-----------------------------------------------------------------------------------------------------------

function checkForChangeUserActivationExpectedElements(
  action: 'deactivate' | 'reactivate',
) {
  if (action === 'deactivate') {
    cy.get('h1').contains(`Deactivate ${user_analyst_nc.name}`).should('exist');
    cy.get('p')
      .contains('Deactivated users will receive an email notification.')
      .should('exist');
    cy.get('p')
      .contains(
        'Deactivated users are not charged for. However, if these users have been active at any time during an invoiced calendar month, the user will still be charged for as standard.',
      )
      .should('exist');
    cy.get('p')
      .contains(
        'You can reactivate a user that has been deactivated at any time.',
      )
      .should('exist');
    cy.get('h2')
      .contains(`Do you want to deactivate ${user_analyst_nc.name}`)
      .should('exist');
  }

  if (action === 'reactivate') {
    cy.get('h1').contains(`Reactivate ${user_analyst_nc.name}`).should('exist');
    cy.get('p')
      .contains('Reactivated users will receive an email notification.')
      .should('exist');
    cy.get('p')
      .contains(
        'Users are charged the full standard fee for the month. For example, if you reactivate a user in June, they will be charged for the whole month of June.',
      )
      .should('exist');
    cy.get('h2')
      .contains(`Do you want to reactivate ${user_analyst_nc.name}`)
      .should('exist');
  }

  cy.get('[data-cy=header]').should('exist');
  cy.get('#header-navigation').should('exist');
  cy.get('#change-agreement-bar').should('exist');
  cy.get('[data-cy=footer]').should('exist');
  cy.get('[data-cy=go-back-link]').contains('Go back').should('exist');
  cy.get('input[name="confirm"][value="Yes"]').should('exist');
  cy.get('input[name="confirm"][value="No"]').should('exist');
  cy.get('button').contains('Continue').should('exist');
}

describe_only_if_manage_users_flag_enabled(
  'Confirm Change User Activation Flow',
  () => {
    beforeEach(() => {
      cy.full_login('USER_MANAGER');
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get('[data-cy=status]').then(($status) => {
        if ($status.text().trim() !== 'ACTIVATED') {
          setUserActivation(user_analyst_nc.email, true);
        }
      });
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get('[data-cy=role]').then(($role) => {
        if ($role.text().trim() !== 'Data Analyst') {
          setUserRole(user_analyst_nc.email, 'Analyst');
        }
      });
      cy.task('updateUserInductionStatus', {
        user_email: user_analyst_nc.email,
        done_induction: true,
      });
    });

    it('User Manager deactivates and reactivates a user', () => {
      //---------------------------------------------------------------------------------------------
      cy.log('navigate to change activation page');
      //---------------------------------------------------------------------------------------------

      cy.visit(manageUsersUrl());
      cy.get('h1').contains('Manage users').should('exist');
      cy.get('input#user-search-input').type(user_analyst_nc.email);
      cy.get('search button').contains('Search').click();
      userInManageUsersTableShould(user_analyst_nc.email, 'exist');
      cy.get('h1').contains('Manage users (1)').should('exist');
      cy.get('a').contains('automated-test analyst-user-change-role').click();
      cy.get('h1').contains(`${user_analyst_nc.name}`).should('exist');
      cy.get(`[data-cy="change-activation-link"]`)
        .contains('Deactivate user')
        .click();
      checkForChangeUserActivationExpectedElements('deactivate');

      //---------------------------------------------------------------------------------------------
      cy.log('clicking continue without selecting an option displays error');
      //---------------------------------------------------------------------------------------------
      cy.get('button').contains('Continue').click();
      cy.get('#error-summary').within(() => {
        cy.contains('#error-summary-title', 'There is a problem').should(
          'exist',
        );
        cy.contains('a', 'Select yes to deactivate this user').should('exist');
      });
      cy.get('#change-activation-error').within(() => {
        cy.contains('Select yes to deactivate this user').should('exist');
      });

      //---------------------------------------------------------------------------------------------
      cy.log('error link focuses the Yes radio button');
      //---------------------------------------------------------------------------------------------
      cy.get('[data-cy=error-summary-link]').click();
      cy.get('input[name="confirm"][value="Yes"]').should('be.focused');

      //---------------------------------------------------------------------------------------------
      cy.log('deactivate user by clicking yes');
      //---------------------------------------------------------------------------------------------
      cy.get('input[name="confirm"][value="Yes"]').click();
      cy.get('button').contains('Continue').click();
      cy.get('[data-cy=success-message]').should(
        'contain.text',
        `${user_analyst_nc.name} has been deactivated.`,
      );

      //---------------------------------------------------------------------------------------------
      cy.log('user details page shows deactivation timestamp');
      //---------------------------------------------------------------------------------------------
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get('[data-cy=deactivated]')
        .invoke('text')
        .should('match', /\d{1,2}\s+\w+\s+\d{4}/);
      cy.get('[data-cy=status]').should('have.text', 'DEACTIVATED');

      //---------------------------------------------------------------------------------------------
      cy.log('navigate to confirm change page again reactivate link');
      //---------------------------------------------------------------------------------------------
      cy.get(`[data-cy="change-activation-link"]`)
        .contains('Reactivate user')
        .click();
      checkForChangeUserActivationExpectedElements('reactivate');

      //---------------------------------------------------------------------------------------------
      cy.log('reactivate user by clicking yes');
      //---------------------------------------------------------------------------------------------
      cy.get('input[name="confirm"][value="Yes"]').click();
      cy.get('button').contains('Continue').click();
      cy.get('[data-cy=success-message]').should(
        'contain.text',
        `${user_analyst_nc.name} has been reactivated.`,
      );

      //---------------------------------------------------------------------------------------------
      cy.log('success banner is removed after navigate');
      //---------------------------------------------------------------------------------------------
      cy.get('[data-cy=go-back-link]').click();
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users`,
      );
      cy.get('h1').contains('Manage users').should('exist');
      cy.get('[data-cy=success-message]').should('not.exist');

      //---------------------------------------------------------------------------------------------
      cy.log('clicking no takes you back to the user details page');
      //---------------------------------------------------------------------------------------------
      cy.visit(userDetailsUrl(user_analyst_nc.email));
      cy.get(`[data-cy="change-activation-link"]`)
        .contains('Deactivate user')
        .click();
      cy.get('input[name="confirm"][value="No"]').should('exist').click();
      cy.get('button').contains('Continue').click();
      cy.get('h1').contains(`${user_analyst_nc.name}`).should('exist');
      cy.get('[data-cy=status]').contains('ACTIVATED').should('exist');

      //---------------------------------------------------------------------------------------------
      cy.log('clicking Go back takes you to user details page');
      //---------------------------------------------------------------------------------------------
      cy.get(`[data-cy="change-activation-link"]`)
        .contains('Deactivate user')
        .click();
      cy.get('h2')
        .contains(`Do you want to deactivate ${user_analyst_nc.name}`)
        .should('exist');
      cy.get('[data-cy=go-back-link]').contains('Go back').click();
      cy.get('h1').contains(`${user_analyst_nc.name}`).should('exist');
      cy.get('[data-cy=status]').contains('ACTIVATED').should('exist');
    });
  },
);
