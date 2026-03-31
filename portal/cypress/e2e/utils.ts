import { CookieNames } from '@/config/constants';

import { getUserCredentials } from '../support/commands';

//
// URLS
//
export const agreementUrl = (agreement_id: string = QA01_ID) =>
  `/agreement/${agreement_id}`;

export const switchAgreementUrl = (agreement_id: string = QA01_ID) =>
  `${agreementUrl(agreement_id)}/switchagreement`;

export const manageUsersUrl = (agreement_id: string = QA01_ID) =>
  `${agreementUrl(agreement_id)}/manage-users`;

export const addUserUrl = (agreement_id: string = QA01_ID) =>
  `${manageUsersUrl(agreement_id)}/add-user`;

export const addUserConfirmUrl = (agreement_id: string = QA01_ID) =>
  `${manageUsersUrl(agreement_id)}/add-user/confirm?form_id=999999`;

export const userDetailsUrl = (
  user_email: string,
  agreement_id: string = QA01_ID,
) => `${manageUsersUrl(agreement_id)}/user/${user_email}`;

export const confirmChangeActivationUrl = (
  user_email: string,
  agreement_id: string = QA01_ID,
) => `${userDetailsUrl(user_email, agreement_id)}/confirm-change-activation`;

export const changeRoleUrl = (
  user_email: string,
  agreement_id: string = QA01_ID,
) => `${userDetailsUrl(user_email, agreement_id)}/change-role`;

export const inductionStartPageUrl = () => '/induction';

export const inductionQuestionPageUrl = (question_number: string) =>
  `/induction/question/${question_number}`;

export const inductionPassedPageUrl = () => '/induction/passed';

export const inductionNotPassedPageUrl = () => '/induction/not-passed';

export function navigateToPageAndConfirmLoad(
  url: string,
  selector = '[data-cy=page-identifier]',
) {
  cy.visit(url);
  cy.get(selector).should('be.visible');
}

//
// Users
//

// User type C (cypress) - These users are logged into by cypress
// If you change attributes on these users, like their role or activation, you will break other tests
// So don't modify them
// Cypress user credentials
export const user_analyst_c = getUserCredentials('ANALYST');
export const user_manager_c = getUserCredentials('USER_MANAGER');
export const user_admin_c = getUserCredentials('SUPPORT_ADMIN');
export const user_maintainer_c = getUserCredentials('MAINTAINER');

// User type NC (non-cypress) - These users are not logged into by cypress
// Feel free to change their activation, role or other attributes
// Although warning, if you need them to have a certain attribute, you may have to set it at the start of the test
// E.g: activate them if you need them to be activated
// WARNING: These users were created manually, not by code
// Manually defined non-Cypress users (for use when getUserCredentials doesn't cover it)
export const user_analyst_nc = {
  email: 'automatedanalyst@example.com',
  name: 'automated-test analyst-user-change-role',
};
export const user_manager_nc = {
  email: 'automatedusermanager@example.com',
  name: 'automated-test user-manager-change-role',
};
export const user_data_wrangler_nc = {
  email: 'automateddatawrangler@example.com',
  name: 'automated-test data-wrangler',
};
export const user_support_admin_nc = {
  email: 'automatedsupportadmin@example.com',
  name: 'automated-test support-admin',
};
export const user_maintainer_nc = {
  email: 'maintainer@example.com',
  name: 'automated-test maintainer',
};

//
// Helper functions
//

export function setUserRole(
  user_email: string,
  new_role: string,
  agreement_id: string = QA01_ID,
) {
  cy.visit(userDetailsUrl(user_email, agreement_id));
  cy.get(`[data-cy="change-role-link"]`, { timeout: 15 * 2000 })
    .should('exist')
    .click();
  cy.get(`input[name="role"][value="${new_role}"]`, { timeout: 15 * 2000 })
    .should('exist')
    .click();
  cy.get('button').contains('Confirm role').click();
  cy.get('[data-cy=success-message]', { timeout: 15 * 2000 }).should(
    'contain.text',
    `has been changed to`,
  );
}

export function setUserActivation(
  user_email: string,
  new_activation: boolean,
  agreement_id: string = QA01_ID,
) {
  cy.log(
    'WARNING: You need to already be logged in as a user manager for this function to work',
  );

  cy.visit(confirmChangeActivationUrl(user_email, agreement_id));

  cy.get('h1').contains('activate').should('exist');

  const de_or_re_activate = new_activation ? 'Reactivate' : 'Deactivate';

  // look at the user manager's activation
  // if they are deactivated then make them activated
  cy.get(`h1`).then(($h1) => {
    if ($h1.text().includes(de_or_re_activate)) {
      cy.get('input[name="confirm"][value="Yes"]').click();
      cy.get('button').contains('Continue').click();
      cy.get('h1', { timeout: 15 * 2000 })
        .contains('Manage users', { timeout: 15 * 2000 })
        .should('exist');
    }
  });
}

export function setTestAddUserFormCookie(
  first_name: string,
  last_name: string,
  email: string,
  role: string,
  user = '888888',
) {
  cy.setCookie(
    CookieNames.ADD_USER_FORM,
    JSON.stringify({
      first_name,
      last_name,
      email,
      role,
      user_id: user,
    }),
  );
}

export function setTestInductionCookie(
  answers: { [index: string]: number[] } = {},
  wrong: number[] = [],
  passed?: boolean,
  user: AllowedUserType = 'ANALYST',
) {
  const email = getUserCredentials(user).email;

  // Use Cypress task to hash it in Node
  cy.task('stringToHash', { input: email }).then((hashedEmail) => {
    cy.setCookie(
      CookieNames.INDUCTION,
      JSON.stringify({
        answers,
        wrong,
        passed,
        user: hashedEmail,
      }),
    );
  });
}

export function userInManageUsersTableShould(
  user_email: string,
  should: string,
) {
  cy.get(
    `section[aria-label="User list"] tr a[href="${userDetailsUrl(user_email)}"]`,
  ).should(should);
}

//
// Unique IDs in the different environments
//

export const expected_agreements = {
  local: ['dsa-000000-qad01', 'dsa-000000-qad02', 'platform', 'digitrials-fss'],
  dev: ['dsa-000000-qad01', 'dsa-000000-qad02', 'platform', 'digitrials-fss'],
  test: ['dsa-000000-qat01', 'dsa-000000-qat02', 'platform', 'digitrials-fss'],
  int: ['dsa-000000-qai01', 'dsa-000000-qai02', 'platform', 'digitrials-fss'],
};

export const QA01_ID = expected_agreements[Cypress.env('BUILD_ENV')][0];

export const agreement_friendly_names = {
  local: 'Quality Assurance Development Agreement 1',
  dev: 'Quality Assurance Development Agreement 1',
  test: 'Quality Assurance Test Agreement 1',
  int: 'Quality Assurance Integration Agreement 1',
};

export const QA01_FRIENDLY_NAME =
  agreement_friendly_names[Cypress.env('BUILD_ENV')];

//
// Utils to only run tests in certain environments where feature flags are enabled
//
export const manage_users_flag_enabled = ['local', 'dev', 'test'].includes(
  Cypress.env('BUILD_ENV'),
);

export const induction_flag_enabled = ['local', 'dev', 'test'].includes(
  Cypress.env('BUILD_ENV'),
);
export const describe_only_if_manage_users_flag_enabled =
  manage_users_flag_enabled ? describe : describe.skip;

export const describe_only_if_induction_flag_enabled = induction_flag_enabled
  ? describe
  : describe.skip;
// eslint-disable-next-line no-constant-condition
export const describe_only_if_maintenance_flag_enabled = true
  ? describe
  : describe.skip;

export const maintenancePageUrl = () => '/maintenance';
