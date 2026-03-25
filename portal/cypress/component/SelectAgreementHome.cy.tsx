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
    cy.contains('a', 'Clear search').should('not.exist');
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
    cy.contains('a', 'Clear search').should('not.exist');
    cy.contains('table tbody tr', 'DSA-OTHER-1').should('exist');
    cy.contains('table tbody tr td a', 'Other Agreement 1').should('exist');
    cy.contains('table tbody tr', 'DSA-OTHER-2').should('exist');
    cy.contains('table tbody tr td a', 'Other Agreement 2').should('exist');
    cy.contains('table tbody tr td a', 'dsa-other-3').should('exist');
    cy.contains('table tbody tr td', 'DSA-OTHER-3').should('exist');
  });

  it('single agreement search result', () => {
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
        { agreement_id: 'dsa-test-3', meaningful_name: null },
      ]),
    );
    cy.get('input[name="agreement-search-input"]').type('test');
    cy.get('form').submit();

    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('table tbody tr td', 'dsa-test-3').should('exist');

    cy.get('#search-result-caption').should(
      'contain.text',
      "1 agreement found matching 'test'",
    );

    cy.contains('table tbody tr td', 'Other Agreement 1').should('not.exist');
    cy.contains('table tbody tr td', 'Other Agreement 2').should('not.exist');

    cy.contains('a', 'Clear search').should('exist');
  });

  it('multiple agreement search resullts', () => {
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
        { agreement_id: 'dsa-test-3', meaningful_name: null },
      ]),
    );

    cy.get('input[name="agreement-search-input"]').type('other');
    cy.get('form').submit();

    cy.get('table tbody tr').should('have.length', 2);
    cy.contains('table tbody tr td', 'Other Agreement 1').should('exist');
    cy.contains('table tbody tr td', 'Other Agreement 2').should('exist');
    cy.contains('a', 'Clear search').should('exist');

    cy.get('#search-result-caption').should(
      'contain.text',
      "2 agreements found matching 'other'",
    );

    cy.contains('table tbody tr td', 'dsa-test-3').should('not.exist');
  });

  it('no agreement found on search', () => {
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
        { agreement_id: 'dsa-test-3', meaningful_name: null },
      ]),
    );

    cy.get('input[name="agreement-search-input"]').type('sas');
    cy.get('form').submit();

    cy.get('table tbody tr').should('have.length', 0);
    cy.get('h2').should('contain.text', "No agreements found matching 'sas'");
    cy.contains('a', 'Clear search').should('exist');

    cy.get('p').should(
      'contain.text',
      'Try searching using different criteria',
    );

    cy.contains('table tbody tr td', 'dsa-test-3').should('not.exist');
    cy.contains('table tbody tr td', 'Other Agreement 1').should('not.exist');
    cy.contains('table tbody tr td', 'Other Agreement 2').should('not.exist');
  });

  it('clear search results after successful search', () => {
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
        { agreement_id: 'dsa-test-3', meaningful_name: null },
      ]),
    );

    cy.get('input[name="agreement-search-input"]').type('other');
    cy.get('form').submit();

    cy.get('table tbody tr').should('have.length', 2);
    cy.contains('table tbody tr td', 'Other Agreement 1').should('exist');
    cy.contains('table tbody tr td', 'Other Agreement 2').should('exist');
    cy.contains('a', 'Clear search').should('be.visible');

    cy.get('#search-result-caption').should(
      'contain.text',
      "2 agreements found matching 'other'",
    );

    cy.contains('table tbody tr td', 'dsa-test-3').should('not.exist');

    cy.contains('a', 'Clear search').click();

    cy.get('input[name="agreement-search-input"]').should('have.value', '');
    cy.contains('a', 'Clear search').should('not.exist');
    cy.get('table tbody tr').should('have.length', 3);
    cy.get('#search-result-caption').should('not.exist');
  });
});
