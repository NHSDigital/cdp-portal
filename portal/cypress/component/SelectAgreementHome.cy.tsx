import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { SessionContext } from 'next-auth/react';
import React from 'react';

import { SelectAgreementPageContent } from '@/app/_components/SelectAgreementPageContent';
import { getWhiteLabelValues } from '@/config/whiteLabel';

import type { Agreement } from '../../services/getUserAgreements';

export const noop = () => {
  return undefined;
};

const SelectAgreementPageContentJSX = (activeAgreements: Agreement[]) => {
  process.env.PORTAL_SERVICE = 'SDE';
  const whiteLabelValues = getWhiteLabelValues();
  return (
    <AppRouterContext.Provider
      value={{
        push: cy.stub(),
        back: cy.stub(),
        forward: cy.stub(),
        refresh: cy.stub(),
        replace: cy.stub(),
        prefetch: cy.stub(),
      }}
    >
      <SessionContext.Provider
        // @ts-ignore
        value={{ data: { user: { email: 'fake@fake.fake' } } }}
      >
        <SelectAgreementPageContent
          agreements_to_display={activeAgreements}
          whiteLabelValues={whiteLabelValues}
        ></SelectAgreementPageContent>
      </SessionContext.Provider>
    </AppRouterContext.Provider>
  );
};

describe('<SelectAgreementPageContentJSX />', () => {
  it('correctly shows warning with no agreements', () => {
    cy.mount(SelectAgreementPageContentJSX([]));

    cy.contains(
      'p',
      "You aren't a member of any agreements in our database. If this is in error please contact us.",
    ).should('exist');
  });

  it('correctly shows multiple agreements', () => {
    cy.mount(
      SelectAgreementPageContentJSX([
        {
          agreement_id: 'dsa-other-1',
          meaningful_name: 'Other Agreement 1',
        },
        {
          agreement_id: 'dsa-other-2',
          meaningful_name: 'Other Agreement 2',
        },
        { agreement_id: 'dsa-other-3', meaningful_name: null },
      ]),
    );
    cy.contains('form div label', 'Other Agreement 1').should('exist');
    cy.contains('form div div p', 'dsa-other-1'.toUpperCase()).should('exist');

    cy.contains('form div label', 'Other Agreement 2').should('exist');
    cy.contains('form div div p', 'dsa-other-2'.toUpperCase()).should('exist');

    cy.contains('form div label', 'dsa-other-3').should('exist');
    cy.get('[data-cy=empty-p]').should('exist');
  });

  it('errors displayed on page correctly', () => {
    cy.mount(
      SelectAgreementPageContentJSX([
        {
          agreement_id: 'dsa-other-1',
          meaningful_name: 'Other Agreement 1',
        },
        {
          agreement_id: 'dsa-other-2',
          meaningful_name: 'Other Agreement 2',
        },
        { agreement_id: 'dsa-other-3', meaningful_name: null },
      ]),
    );
    cy.get('[data-cy=submit-button]').click();
    cy.get('h2').contains('There is a problem').should('exist');
    cy.get('a').contains('Select an agreement').should('exist');
    cy.get('span').contains('Select an agreement').should('exist');
  });
});
