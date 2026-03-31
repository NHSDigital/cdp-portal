'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { WhiteLabelEntry } from '@/config/whiteLabel';
import { useAsyncError } from '@/helpers/errorHelpers';

import { AreYouSurePage } from './AreYouSureContent';
import { LoadingAgreement } from './LoadingAgreementContent';

export interface LoadingState {
  state: 'confirmation' | 'loading';
}

interface SwitchAgreementManagerProps {
  agreement_id: string;
  agreement_count: number;
  appstream_desktop_client_enabled: boolean;
  whiteLabelValues: WhiteLabelEntry;
}

export default function SwitchAgreementManager({
  agreement_id,
  agreement_count,
  appstream_desktop_client_enabled,
  whiteLabelValues,
}: SwitchAgreementManagerProps) {
  const router = useRouter();
  const throwAsyncError = useAsyncError();
  const [agreement_loading_state, setLoadingAgreement] = useState<LoadingState>(
    {
      state: 'confirmation',
    },
  );

  // detects if a user has navigated away from the page by pressing go back or changing URL
  // this updates the flag, so in the callback function below we do not redirect to appstream
  // as in NextJS the function will continue to run even after changing route
  const hasNavigated = useRef(false);
  useEffect(() => {
    const handleUnload = () => {
      hasNavigated.current = true;
    };
    window.addEventListener('beforeunload', handleUnload);
    hasNavigated.current = false;
    return () => {
      handleUnload();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const switchAgreementCb = useCallback(
    // istanbul ignore next
    async (open_using: 'browser' | 'desktop' = 'browser') => {
      setLoadingAgreement({ state: 'loading' });
      await switchAgreementRequest({
        agreement_id,
        open_using,
        hasNavigated,
        router,
        throwAsyncError,
      });
    },
    [router, agreement_id, throwAsyncError],
  );

  return (
    <SwitchAgreementContent
      agreement_id={agreement_id}
      agreement_count={agreement_count}
      agreement_loading_state={agreement_loading_state}
      appstream_desktop_client_enabled={appstream_desktop_client_enabled}
      switchAgreementCb={switchAgreementCb}
      whiteLabelValues={whiteLabelValues}
    />
  );
}

interface SwitchAgreementContentProps {
  agreement_id: string;
  agreement_count: number;
  agreement_loading_state: LoadingState;
  appstream_desktop_client_enabled: boolean;
  switchAgreementCb: (open_using?: string) => Promise<void>;
  whiteLabelValues: WhiteLabelEntry;
}

export function SwitchAgreementContent({
  agreement_id,
  agreement_count,
  agreement_loading_state,
  appstream_desktop_client_enabled,
  switchAgreementCb,
  whiteLabelValues,
}: SwitchAgreementContentProps) {
  const shouldQuickLaunch: boolean =
    agreement_count === 1 && !appstream_desktop_client_enabled;

  useEffect(() => {
    if (shouldQuickLaunch) switchAgreementCb();
  }, [shouldQuickLaunch, switchAgreementCb]);

  if (shouldQuickLaunch) {
    return (
      <LoadingAgreement
        agreement_id={agreement_id}
        whiteLabelValues={whiteLabelValues}
      />
    );
  }

  switch (agreement_loading_state.state) {
    case 'confirmation':
      return (
        <AreYouSurePage
          agreement_id={agreement_id}
          switchAgreementCb={switchAgreementCb}
          appstream_desktop_client_enabled={appstream_desktop_client_enabled}
          whiteLabelValues={whiteLabelValues}
        />
      );
    case 'loading':
      return (
        <LoadingAgreement
          agreement_id={agreement_id}
          whiteLabelValues={whiteLabelValues}
        />
      );
    default:
      return null;
  }
}

async function switchAgreementRequest({
  agreement_id,
  open_using,
  hasNavigated,
  router,
  throwAsyncError,
}: {
  agreement_id: string;
  open_using: 'browser' | 'desktop';
  hasNavigated: React.MutableRefObject<boolean>;
  router: ReturnType<typeof useRouter>;
  throwAsyncError: (msg: string) => void;
}) {
  let resp;
  try {
    resp = await fetch('/api/switchagreement', {
      method: 'POST',
      body: JSON.stringify({
        agreement_id: agreement_id,
        uses_js: 'true',
        open_using,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (resp.status !== 200) throw new Error('Response returned non 200');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    if (hasNavigated.current) return;

    if (resp) {
      const respMessage: string = await resp.text();
      if (
        respMessage.includes(
          'Previous execution is still in progress - aborting',
        )
      ) {
        router.push(`/agreement/${agreement_id}/locked`);
        return;
      }
    }

    throwAsyncError('Failed to switch agreement');
    return;
  }

  if (hasNavigated.current) return;

  const { redirect_url } = await resp.json();

  if (open_using === 'desktop') {
    const b64encoded = Buffer.from(redirect_url).toString('base64');
    router.push(`amazonappstream:${b64encoded}`);
  } else {
    window.history.replaceState(null, '', `/agreement/${agreement_id}`);
    router.push(redirect_url);
  }
}
