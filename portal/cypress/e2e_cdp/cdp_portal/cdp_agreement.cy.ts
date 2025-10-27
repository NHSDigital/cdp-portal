import {
  cdpAgreementUrl,
  describe_only_if_manage_users_flag_enabled,
  user_analyst_c,
} from '../utils';

//---------------------------------------------------------------------------
// Tests for the page "portal/app/agreement/[agreement_id]"
//---------------------------------------------------------------------------

// Every E2E test file needs this, or else retries pass when they should fail
// eslint-disable-next-line @typescript-eslint/no-empty-function
beforeEach(() => {});

describe_only_if_manage_users_flag_enabled(
  'agreement page tests for Analyst CDP url',
  () => {
    beforeEach(() => {
      cy.task('updateUserInductionStatus', {
        user_email: user_analyst_c.email,
        done_induction: true,
      });
      cy.full_login('ANALYST');
      cy.visit(cdpAgreementUrl());
    });

    it('Analyst - can see Launch the virtual desktop', () => {
      cy.contains('Launch the virtual desktop').should('exist');
    });
    it('Analysts - cannot see Upload reference data', () => {
      cy.contains('Upload reference data').should('not.exist');
    });
    it('Analysts - cannot see manage users panel', () => {
      cy.contains('Manage users').should('not.exist');
    });
  },
);

export {};
