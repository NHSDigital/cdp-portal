'use client';

import { WarningCallout } from 'nhsuk-react-components';
import { useEffect } from 'react';

import SwitchAgreementButton from '@/app/agreement/[agreement_id]/switchagreement/_components/SwitchAgreementButton';
import BackLink from '@/app/shared/backLink';
import { WhiteLabelEntry } from '@/config/whiteLabel';

interface AreYouSureProps {
  agreement_id: string;
  switchAgreementCb: (open_using?: string) => Promise<void>;
  appstream_desktop_client_enabled: boolean;
  whiteLabelValues: WhiteLabelEntry;
}

export function AreYouSurePage({
  agreement_id,
  switchAgreementCb: switchAgreement,
  appstream_desktop_client_enabled,
  whiteLabelValues,
}: AreYouSureProps) {
  useEffect(() => {
    document.title = `Confirm agreement - ${whiteLabelValues.acronym}`;
  });

  return (
    <>
      <BackLink
        data-testid='go-back-to-home'
        href={`/agreement/${agreement_id}`}
        label='Go back to home'
      />
      <h1>Confirm your agreement selection</h1>
      <p className='nhsuk-lede-text'>
        You are about to open the agreement {agreement_id}.
      </p>
      <WarningCallout>
        <h2 className='nhsuk-warning-callout__label'>Warning</h2>
        <p>
          Switching agreements will close any open sessions, and any unsaved
          work will be lost.
        </p>
      </WarningCallout>
      <div className={'nhsuk-grid-row'}>
        {appstream_desktop_client_enabled && (
          <>
            <div className={'nhsuk-grid-column-one-half'}>
              <SwitchAgreementButton
                agreement_id={agreement_id}
                switchAgreementCb={switchAgreement}
                open_using={'browser'}
              >
                Launch the virtual desktop in the browser
              </SwitchAgreementButton>
            </div>
            <div className={'nhsuk-grid-column-one-half'}>
              <SwitchAgreementButton
                agreement_id={agreement_id}
                switchAgreementCb={switchAgreement}
                open_using={'desktop'}
              >
                Launch the virtual desktop using desktop client
              </SwitchAgreementButton>
            </div>
          </>
        )}
        {!appstream_desktop_client_enabled && (
          <>
            <div className={'nhsuk-grid-column-one-half'}>
              <SwitchAgreementButton
                agreement_id={agreement_id}
                switchAgreementCb={switchAgreement}
                open_using={'browser'}
              >
                Launch the virtual desktop
              </SwitchAgreementButton>
            </div>
          </>
        )}
      </div>
      <p style={{ marginTop: 30 }}>
        Continuing will open up the virtual desktop, where you can access the
        data, tools and services in your agreement.
      </p>
    </>
  );
}
