'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AreYouSurePage } from './AreYourSureContent';
import { LoadingAgreement } from './LoadingAgreementContent';

interface LoadingState {
  state: 'confirmation' | 'loading';
}

interface SwitchAgreementManagerProps {
  agreement_id: string;
  agreement_count: number;
  appstream_desktop_client_enabled: boolean;
}

export default function SwitchAgreementManager({
  agreement_id,
  agreement_count,
  appstream_desktop_client_enabled,
}: SwitchAgreementManagerProps) {
  const router = useRouter();
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
    async (open_using = 'browser') => {
      setLoadingAgreement({ state: 'loading' });

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
      } catch (err) {
        // checks flag to ensure user is still waiting for appstream to load
        if (hasNavigated.current) return;

        if (typeof resp !== 'undefined') {
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

        router.push('/500');
        return;
      }

      // checks flag to ensure user is still waiting for appstream to load
      if (hasNavigated.current) return;

      const { redirect_url } = (await resp.json()) as {
        redirect_url: string;
      };

      if (open_using == 'desktop') {
        const b64encoded = Buffer.from(redirect_url).toString('base64');
        const desktop_url = `amazonappstream:${b64encoded}`;
        router.push(desktop_url);
      } else {
        // Quickly replace the current URL with the /[agreement_id] URL
        // so that when a user goes back they go to /[agreement_id] page, and don't get immediately logged back in
        window.history.replaceState(null, '', `/agreement/${agreement_id}`);

        router.push(redirect_url);
      }
    },
    [router, agreement_id],
  );

  return (
    <SwitchAgreementContent
      agreement_id={agreement_id}
      agreement_count={agreement_count}
      agreement_loading_state={agreement_loading_state}
      appstream_desktop_client_enabled={appstream_desktop_client_enabled}
      switchAgreementCb={switchAgreementCb}
    />
  );
}

interface SwitchAgreementContentProps {
  agreement_id: string;
  agreement_count: number;
  agreement_loading_state: LoadingState;
  appstream_desktop_client_enabled: boolean;
  switchAgreementCb: (open_using?: string) => Promise<void>;
}

function SwitchAgreementContent({
  agreement_id,
  agreement_count,
  agreement_loading_state,
  appstream_desktop_client_enabled,
  switchAgreementCb,
}: SwitchAgreementContentProps) {
  // if only one agreement immediatley start switch agreement process
  useEffect(() => {
    if (agreement_count === 1) switchAgreementCb();
  }, [agreement_count, switchAgreementCb]);
  if (agreement_count == 1) {
    return <LoadingAgreement agreement_id={agreement_id} />;
  }

  switch (agreement_loading_state.state) {
    case 'confirmation':
      return (
        <AreYouSurePage
          agreement_id={agreement_id}
          switchAgreementCb={switchAgreementCb}
          appstream_desktop_client_enabled={appstream_desktop_client_enabled}
        />
      );
    case 'loading':
      return <LoadingAgreement agreement_id={agreement_id} />;
    default:
      return null;
  }
}
