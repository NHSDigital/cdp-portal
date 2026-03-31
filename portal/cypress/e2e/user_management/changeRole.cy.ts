import {
  describe_only_if_manage_users_flag_enabled,
  setUserActivation,
  setUserRole,
  user_analyst_nc,
  userDetailsUrl,
} from '../utils';

//---------------------------------------------------------------------------------------------
// User Flow Test for the page "portal/app/agreement/[agreement_id]/manage-users/[user_id]/change-role"
//---------------------------------------------------------------------------------------------

describe_only_if_manage_users_flag_enabled('Change User Role Flow', () => {
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

  it('User Manager changes user role', () => {
    //-------------------------------------------------------------------------------------------
    cy.log('Check user details page for Analyst');
    //-------------------------------------------------------------------------------------------
    cy.visit(userDetailsUrl(user_analyst_nc.email));
    cy.checkAccessibility('main');
    cy.get('h1').contains(user_analyst_nc.name).should('exist');
    cy.get('[data-cy=header]').should('exist');
    cy.get('#header-navigation').should('exist');
    cy.get('#change-agreement-bar').should('exist');
    cy.get('[data-cy=footer]').should('exist');
    cy.get('h1').contains(user_analyst_nc.name).should('exist');
    cy.get('dd').contains('Data Analyst').should('exist');
    cy.get('dt').contains('VDI memory size').should('exist');
    cy.get('dt').contains('Added to agreement').should('exist');
    cy.get('dt').contains('Reactivated').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('navigate to change role page');
    //-------------------------------------------------------------------------------------------
    cy.get(`[data-cy="change-role-link"]`).click();
    cy.get('h1').contains('Change user role').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('try continuing without selecting a role');
    //-------------------------------------------------------------------------------------------
    cy.get('button').contains('Confirm role').click();
    cy.get('a').contains('Select a role').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('change role from Analyst to User Manager');
    //-------------------------------------------------------------------------------------------
    cy.get('input[name="role"][value="UserManager"]').click();
    cy.get('button').contains('Confirm role').click();
    cy.get('[data-cy=success-message]').should(
      'contain.text',
      `${user_analyst_nc.name}'s role has been changed to User Manager.`,
    );
    cy.get('[data-cy=role]').get('dd').contains('User Manager').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('Check user details page for User Manager');
    //-------------------------------------------------------------------------------------------
    cy.get('h1').contains(user_analyst_nc.name).should('exist');
    cy.get('dt').contains('Added to agreement').should('exist');
    cy.get('dt').contains('VDI memory size').should('not.exist');
    cy.get('dt').contains('Induction assessment passed').should('not.exist');

    //-------------------------------------------------------------------------------------------
    cy.log('change role from User Manager to Both');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy=change-role-link]').contains('Change').click();
    cy.get('h1').contains('Change user role').should('exist');
    cy.get('input[name="role"][value="Both"]').click();
    cy.get('button').contains('Confirm role').click();
    cy.get('[data-cy=success-message]').should(
      'contain.text',
      `${user_analyst_nc.name}'s role has been changed to both Analyst and User Manager`,
    );
    cy.get('[data-cy=role]')
      .get('dd')
      .contains('Both (Data Analyst and User Manager)')
      .should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('Check user details page for Both');
    //-------------------------------------------------------------------------------------------
    cy.get('h1').contains(user_analyst_nc.name).should('exist');
    cy.get('dt').contains('VDI memory size').should('exist');
    cy.get('dt').contains('Added to agreement').should('exist');
    cy.get('dt').contains('Last logged in').should('exist');
    cy.get('dt').contains('Induction assessment passed').should('exist');

    //-------------------------------------------------------------------------------------------
    cy.log('change role from Both to Analyst');
    //-------------------------------------------------------------------------------------------
    cy.get('[data-cy=change-role-link]').contains('Change').click();
    cy.get('h1').contains('Change user role').should('exist');
    cy.get('input[name="role"][value="Analyst"]').click();
    cy.get('button').contains('Confirm role').click();
    cy.get('[data-cy=success-message]').should(
      'contain.text',
      `${user_analyst_nc.name}'s role has been changed to Analyst`,
    );
    cy.get('[data-cy=role]').get('dd').contains('Analyst').should('exist');
    cy.get('[data-cy=header]')
      .contains('a', 'SDE Portal')
      .should('exist')
      .click();
    cy.get('h1')
      .contains('Secure Data Environment (SDE) Portal')
      .should('exist');
  });
});

export {};
