import 'cypress-axe';

//---------------------------------------------------------------------------------------------
// User Flow Test for the password setup functionality"
//---------------------------------------------------------------------------------------------

const SHOULD_DO_PASSWORD_SETUP_TESTS = ['local', 'dev', 'test'].includes(
  Cypress.env('BUILD_ENV'),
);
const USER_PASSWORD_SETUP_FLOW = {
  email: 'portal.cypress.test-password-setup@example.com',
  name: 'Portal Password Testing',
};
const describe_only_if_password_setup_enabled = SHOULD_DO_PASSWORD_SETUP_TESTS
  ? describe
  : describe.skip;

describe_only_if_password_setup_enabled('Password setup flow tests', () => {
  it('full e2e', () => {
    const valid_guid = '666666';

    //-------------------------------------------------------------------------------------------
    cy.log('Navigate to confirm email page');
    //-------------------------------------------------------------------------------------------
    cy.visit(`/confirm-email-address?id=${valid_guid}`);
    cy.get('h1').contains('Confirm your email address').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Click continue without entering an email');
    //-------------------------------------------------------------------------------------------
    cy.get('button').contains('Continue').click();
    cy.get('[data-cy="error-summary"]').should('exist');
    cy.get('a').contains('Enter your email address').should('exist');
    cy.get('span').contains('Enter your email address').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Enter an email with an expired guid');
    //-------------------------------------------------------------------------------------------
    const expired_guid = String(Math.floor(Math.random() * 1000000)).padStart(
      6,
      '0',
    );
    cy.task('updateUserPasswordResetGuid', {
      guid: expired_guid,
      user_email: USER_PASSWORD_SETUP_FLOW.email,
      is_expired: true,
    });
    cy.visit(`/confirm-email-address?id=${expired_guid}`);
    cy.get('input[name="email_address"]')
      .should('exist')
      .clear()
      .type(USER_PASSWORD_SETUP_FLOW.email);
    cy.get('button').contains('Continue').click();
    cy.get('h1').contains('Setup link expired').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Resend link and assert success message');
    //-------------------------------------------------------------------------------------------
    cy.get('button').contains('Request a new link').click();
    cy.get('[data-cy=success-message]', { timeout: 10000 }).contains(
      'Your email has been resent',
      { timeout: 10000 },
    );
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Set valid guid and enter correct email');
    //-------------------------------------------------------------------------------------------
    cy.task('updateUserPasswordResetGuid', {
      guid: valid_guid,
      user_email: USER_PASSWORD_SETUP_FLOW.email,
    });
    cy.visit(`/confirm-email-address?id=${valid_guid}`);
    cy.get('input[name="email_address"]')
      .should('exist')
      .clear()
      .type(USER_PASSWORD_SETUP_FLOW.email);
    cy.get('button').contains('Continue').click();
    cy.get('h1').contains('Set up password').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Click continue without entering password');
    //-------------------------------------------------------------------------------------------
    cy.get('button').contains('Continue').click();
    cy.get('a').contains('Enter a password').should('exist');
    cy.get('span').contains('Enter a password').should('exist');
    cy.checkAccessibility('main');

    //-------------------------------------------------------------------------------------------
    cy.log('Enter valid password and continue');
    //-------------------------------------------------------------------------------------------
    const valid_password = 'ThisIsValid123!';
    cy.get('input[name="enter_password"]')
      .should('exist')
      .clear()
      .type(valid_password);
    cy.get('input[name="confirm_password"]')
      .should('exist')
      .clear()
      .type(valid_password);
    cy.get('button').contains('Continue').click();

    //-------------------------------------------------------------------------------------------
    cy.log('Assert initial validation checks passed and correct message shown');
    //-------------------------------------------------------------------------------------------
    cy.get('span').contains('Password has already been set up').should('exist');
  });
});
