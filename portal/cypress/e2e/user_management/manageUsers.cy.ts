import {
  agreementUrl,
  describe_only_if_manage_users_flag_enabled,
  QA01_FRIENDLY_NAME,
  QA01_ID,
  setUserActivation,
  setUserRole,
  user_analyst_nc,
  user_data_wrangler_nc,
  user_manager_nc,
  user_support_admin_nc,
  userDetailsUrl,
  userInManageUsersTableShould,
} from '../utils';

//---------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]/manage-users"
//---------------------------------------------------------------------------

function checkForManageUserExpectedElements() {
  cy.get('[data-cy=header]').should('exist');
  cy.get('[data-cy=footer]').should('exist');
  cy.get('[data-cy=go-back-link]')
    .contains('Go back')
    .should('have.attr', 'href', '.');
  cy.get('h1').contains('Manage users');
  cy.get('[data-cy=agreement_name]')
    .contains(`${QA01_FRIENDLY_NAME}`)
    .should('exist');
  cy.get('[data-cy=user-table]').should('exist');
  cy.get('tr a').contains(user_analyst_nc.name).should('exist');
  cy.get('h2').contains('Filters').should('exist');
  cy.get('h3').contains('Search by name or email').should('exist');
  cy.get('h3').contains('Role').should('exist');
  cy.get('h3').contains('Status').should('exist');
  cy.get('[data-cy=status_key]').contains('What do these statuses mean?').click;
  cy.get('[data-cy=status_key_table]').should('be.visible');
}

function addCheckboxFilter(filter_group: string, filter_value: string) {
  cy.get(`input[name="${filter_group}"][value="${filter_value}"]`).click();
}

describe_only_if_manage_users_flag_enabled('Manage user flow', () => {
  beforeEach(() => {
    cy.full_login('USER_MANAGER');
    cy.visit(userDetailsUrl(user_manager_nc.email));
    cy.get('[data-cy=role]').then(($role) => {
      if ($role.text().trim() !== 'User Manager') {
        cy.get('[data-cy=status]').then(($status) => {
          if ($status.text().trim() !== 'ACTIVATED') {
            setUserActivation(user_manager_nc.email, true);
          }
          cy.visit(userDetailsUrl(user_manager_nc.email));
          setUserRole(user_manager_nc.email, 'UserManager');
        });
      }
    });
    cy.visit(userDetailsUrl(user_manager_nc.email));
    cy.get('[data-cy=status]').then(($status) => {
      if ($status.text().trim() !== 'DEACTIVATED') {
        setUserActivation(user_manager_nc.email, false);
      }
    });
    cy.visit(userDetailsUrl(user_analyst_nc.email));
    cy.get('[data-cy=role]').then(($role) => {
      if ($role.text().trim() !== 'Data Analyst') {
        cy.get('[data-cy=status]').then(($status) => {
          if ($status.text().trim() !== 'ACTIVATED') {
            setUserActivation(user_analyst_nc.email, true);
          }
          cy.visit(userDetailsUrl(user_analyst_nc.email));
          setUserRole(user_analyst_nc.email, 'Analyst');
        });
      }
    });
    cy.visit(userDetailsUrl(user_analyst_nc.email));
    cy.get('[data-cy=status]').then(($status) => {
      if ($status.text().trim() !== 'ACTIVATED') {
        setUserActivation(user_analyst_nc.email, true);
      }
    });
    cy.task('updateUserInductionStatus', {
      user_email: user_manager_nc.email,
      done_induction: false,
    });
    cy.task('updateUserInductionStatus', {
      user_email: user_analyst_nc.email,
      done_induction: true,
    });
  });

  it('User manager manages users', () => {
    //-------------------------------------------------------------------------------------------
    cy.log('Navigate to the manage users page');
    //-------------------------------------------------------------------------------------------
    cy.visit(agreementUrl());
    cy.get('a').contains('Manage users').click();
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/agreement/${QA01_ID}/manage-users`,
    );
    checkForManageUserExpectedElements();
    userInManageUsersTableShould(user_data_wrangler_nc.email, 'not.exist');
    userInManageUsersTableShould(user_support_admin_nc.email, 'not.exist');
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('search for users by name');
    //-------------------------------------------------------------------------------------------
    cy.get('input#user-search-input').type(user_analyst_nc.name);
    cy.get('search button').contains('Search').click();
    userInManageUsersTableShould(user_manager_nc.email, 'not.exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('clear search by name');
    //-------------------------------------------------------------------------------------------
    cy.get('a[aria-label="Remove ' + user_analyst_nc.name + '"]').click();
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('search for users by email');
    //-------------------------------------------------------------------------------------------
    cy.get('input#user-search-input').type(user_manager_nc.email);
    cy.get('search button').contains('Search').click();
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'not.exist');
    cy.get('h1').contains('Manage users (1)').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('clear search by email');
    //-------------------------------------------------------------------------------------------
    cy.get('a[aria-label="Remove ' + user_manager_nc.email + '"]').click();
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('message shown when no results');
    //-------------------------------------------------------------------------------------------
    cy.get('input#user-search-input').type(
      'very-specific-text that-doesnt-exist',
    );
    cy.get('search button').contains('Search').click();
    userInManageUsersTableShould(user_manager_nc.email, 'not.exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'not.exist');
    cy.get('h2').contains('0 results found').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('clear text filter');
    //-------------------------------------------------------------------------------------------
    cy.get(
      'a[aria-label="Remove very-specific-text that-doesnt-exist"]',
    ).click();
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('search by role');
    //-------------------------------------------------------------------------------------------
    cy.get('input[name="role"][value="analyst"]').click();
    cy.get('a[aria-label="Remove Data Analyst"]').should('exist');
    userInManageUsersTableShould(user_manager_nc.email, 'not.exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');
    cy.get('input[name="role"][value="user-manager"]').click();
    cy.get('a[aria-label="Remove User Manager"]').should('exist');
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('clear role search');
    //-------------------------------------------------------------------------------------------
    cy.get('a[aria-label="Remove Data Analyst"]').click();
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'not.exist');
    cy.get('a[aria-label="Remove User Manager"]').click();
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');
    cy.contains('Selected filters').should('not.exist');

    //-------------------------------------------------------------------------------------------
    cy.log('search by activation status');
    //-------------------------------------------------------------------------------------------
    addCheckboxFilter('status', 'activated');
    userInManageUsersTableShould(user_manager_nc.email, 'not.exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('clear activation status search');
    //-------------------------------------------------------------------------------------------
    cy.get('a[aria-label="Remove Activated"]').click();
    cy.contains('Selected filters').should('not.exist');
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('search by induction status');
    //-------------------------------------------------------------------------------------------
    addCheckboxFilter('status', 'pending-induction');
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'not.exist');

    //-------------------------------------------------------------------------------------------
    cy.log('clear induction status search');
    //-------------------------------------------------------------------------------------------
    cy.get('a[aria-label="Remove Pending Induction"]').click();
    cy.contains('Selected filters').should('not.exist');
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    userInManageUsersTableShould(user_analyst_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('search by multiple filters');
    //-------------------------------------------------------------------------------------------
    addCheckboxFilter('role', 'user-manager');
    userInManageUsersTableShould(user_manager_nc.email, 'exist');
    addCheckboxFilter('status', 'activated');
    userInManageUsersTableShould(user_manager_nc.email, 'not.exist');
    cy.contains('Selected filters').should('exist');
    addCheckboxFilter('status', 'deactivated');
    userInManageUsersTableShould(user_manager_nc.email, 'exist');

    //-------------------------------------------------------------------------------------------
    cy.log('clear search by clicking clear link');
    //-------------------------------------------------------------------------------------------
    cy.get('search a').contains('Clear').click();
    cy.get('tr a').contains(user_manager_nc.name).should('exist');
    cy.get('tr a').contains(user_analyst_nc.name).should('exist');
  });
});

export {};
