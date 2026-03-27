import {
  AppRouterContext,
  AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { SessionContext } from 'next-auth/react';
import React from 'react';

import SwitchAgreementManager from '@/app/agreement/[agreement_id]/switchagreement/_components.tsx/SwitchAgreementContent';
import { getWhiteLabelValues } from '@/config/whiteLabel';
import style from '@/styles/BasePage.module.css';

enum TestConfig {
  AGREEMENT_ID = 'dsa-000000-mock',
  REDIRECT_URL = 'https://example.com',
  DESKTOP_URL = 'amazonappstream:aHR0cHM6Ly9leGFtcGxlLmNvbQ==',
}

const getSwitchAgreementContentJSX = (
  agreement_id: string,
  agreement_count: number,
  appstream_desktop_client_enabled: boolean,
) => {
  const default_stubs: AppRouterInstance = {
    push: cy.stub().as('push'),
    back: cy.stub().as('back'),
    forward: cy.stub().as('forward'),
    refresh: cy.stub().as('refresh'),
    replace: cy.stub().as('replace'),
    prefetch: cy.stub().as('prefetch'),
  };

  process.env.PORTAL_SERVICE = 'SDE';
  const whiteLabelValues = getWhiteLabelValues();

  return (
    <html lang='en'>
      <body>
        <AppRouterContext.Provider value={default_stubs}>
          <SessionContext.Provider
            // @ts-ignore
            value={{ data: { user: { email: 'fake@fake.fake' } } }}
          >
            <div className={style.fullPageHeight}>
              <div className='nhsuk-width-container'>
                <main
                  className='nhsuk-main-wrapper nhsuk-u-padding-top-4'
                  id='maincontent'
                >
                  <SwitchAgreementManager
                    agreement_id={agreement_id}
                    agreement_count={agreement_count}
                    appstream_desktop_client_enabled={
                      appstream_desktop_client_enabled
                    }
                    whiteLabelValues={whiteLabelValues}
                  />
                </main>
              </div>
            </div>
          </SessionContext.Provider>
        </AppRouterContext.Provider>
      </body>
    </html>
  );
};

describe('<SwitchAgreementContent />', () => {
  describe('Single Agreement', () => {
    it('LoadingAgreement loads and starts switching immediately', () => {
      cy.intercept('POST', '/api/switchagreement', {
        statusCode: 200,
        body: { redirect_url: TestConfig.REDIRECT_URL },
      }).as('switch_agreement_api');

      cy.mount(getSwitchAgreementContentJSX(TestConfig.AGREEMENT_ID, 1, false));

      cy.document().its('title').should('eq', 'Loading agreement - SDE');
      cy.contains('h1', `Loading agreement ${TestConfig.AGREEMENT_ID}`).should(
        'exist',
      );
      cy.get('@push').should('have.been.calledWith', TestConfig.REDIRECT_URL);
    });
  });

  describe('Multiple Agreements', () => {
    describe('Desktop Access Disabled', () => {
      beforeEach(() => {
        cy.intercept('POST', '/api/switchagreement', {
          statusCode: 200,
          body: { redirect_url: TestConfig.REDIRECT_URL },
        }).as('switch_agreement_api');

        cy.mount(
          getSwitchAgreementContentJSX(TestConfig.AGREEMENT_ID, 2, false),
        );
      });

      it('AreYourSurePage initally loads and does not switch initially', () => {
        cy.document().its('title').should('eq', 'Confirm agreement - SDE');
        cy.contains('h1', 'Confirm your agreement selection').should('exist');
        cy.contains(
          'p',
          `You are about to open the agreement ${TestConfig.AGREEMENT_ID}.`,
        ).should('exist');

        cy.get('@push').should('not.have.been.called');
      });

      it('Go back link goes home', () => {
        cy.get('@push').should('not.have.been.called');

        cy.contains('a', 'Go back to home').click();
        cy.get('@push').should(
          'have.been.calledWith',
          `/agreement/${TestConfig.AGREEMENT_ID}`,
        );
      });

      it('Pressing Lauch the virtual desktop shows LoadingAgreementContent and redirects', () => {
        cy.document().its('title').should('eq', 'Confirm agreement - SDE');
        cy.get('@push').should('not.have.been.called');

        cy.contains('button', 'Launch the virtual desktop').click();

        cy.document().its('title').should('eq', 'Loading agreement - SDE');
        cy.contains(
          'h1',
          `Loading agreement ${TestConfig.AGREEMENT_ID}`,
        ).should('exist');

        cy.get('@push').should('have.been.calledWith', TestConfig.REDIRECT_URL);
      });
    });

    describe('Desktop Access Enabled', () => {
      beforeEach(() => {
        cy.intercept('POST', '/api/switchagreement', {
          statusCode: 200,
          body: { redirect_url: TestConfig.REDIRECT_URL },
        }).as('switch_agreement_api');

        cy.mount(
          getSwitchAgreementContentJSX(TestConfig.AGREEMENT_ID, 2, true),
        );
      });

      it('Updated page with both buttons appears', () => {
        cy.document().its('title').should('eq', 'Confirm agreement - SDE');
        cy.get('@push').should('not.have.been.called');

        cy.contains('button', 'in the browser').should('exist');
        cy.contains('button', 'using desktop client').should('exist');
      });

      it('Launching in browser behaviour remains the same', () => {
        cy.document().its('title').should('eq', 'Confirm agreement - SDE');
        cy.contains('button', 'in the browser').click();
        cy.get('@push').should('have.been.calledWith', TestConfig.REDIRECT_URL);

        cy.document().its('title').should('eq', 'Loading agreement - SDE');
        cy.contains(
          'h1',
          `Loading agreement ${TestConfig.AGREEMENT_ID}`,
        ).should('exist');
      });

      it('Opening in desktop correctly encodes url', () => {
        cy.contains('button', 'using desktop client').click();
        cy.get('@push').should('have.been.calledWith', TestConfig.DESKTOP_URL);

        cy.document().its('title').should('eq', 'Loading agreement - SDE');
        cy.contains(
          'h1',
          `Loading agreement ${TestConfig.AGREEMENT_ID}`,
        ).should('exist');
      });
    });
  });
});
