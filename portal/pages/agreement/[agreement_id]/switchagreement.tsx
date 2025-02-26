import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { BackLink, WarningCallout } from "nhsuk-react-components";
import React, { useCallback, useEffect, useRef, useState } from "react";
import BasePage from "../../../components/BasePage";
import SwitchAgreementButton from "../../../components/SwitchAgreementButton";
import getNotifications, {
  Notices,
  Notice,
} from "../../../services/getNotifications";
import getUserAgreements from "../../../services/getUserAgreements";
import { authOptions } from "../../api/auth/[...nextauth]";
import { Session } from "next-auth";
import { hasFeatureFlagEnabledGivenContextReq } from "app/services/hasFeatureFlagEnabledGivenCookies";
import { INDUCTION_FEATURE_FLAG } from "app/induction/consts";

type CountProp = { agreementCount: number };
type Props = Notices & CountProp;

type LoadingState = { state: "confirmation" } | { state: "loading" };

const SwitchAgreementPage = ({ notificationItems, agreementCount }: Props) => {
  const router = useRouter();
  const { agreement_id } = router.query as {
    agreement_id: string;
  };
  const { agreementLoadingState, switchAgreementCb } =
    useSwitchingAgreementState(agreement_id);

  useEffect(() => {
    if (agreementCount === 1) switchAgreementCb();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (agreementCount === 1) {
    return <LoadingAgreement agreement_id={agreement_id} />;
  }

  switch (agreementLoadingState.state) {
    case "confirmation":
      return (
        <AreYouSurePage
          agreement_id={agreement_id}
          switchAgreementCb={switchAgreementCb}
          notificationItems={notificationItems}
        />
      );

    case "loading":
      return <LoadingAgreement agreement_id={agreement_id} />;
  }
};

const useSwitchingAgreementState = (agreement_id: string) => {
  const router = useRouter();
  const [agreementLoadingState, setLoadingAgreement] = useState<LoadingState>({
    state: "confirmation",
  });
  const [windowLocationState] = useState({
    changed: false,
  });

  useEffect(() => {
    const handleRouteChange = () => {
      windowLocationState.changed = true;
    };

    router.events.on("routeChangeStart", handleRouteChange);

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method:
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchAgreementCb = useCallback(async () => {
    setLoadingAgreement({ state: "loading" });
    let resp;
    try {
      resp = await fetch("/api/switchagreement", {
        method: "POST",
        body: JSON.stringify({
          agreement_id: agreement_id,
          uses_js: "true",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (resp.status !== 200) throw new Error("Response returned non 200");
    } catch (err) {
      if (windowLocationState.changed) return;

      if (typeof resp !== "undefined") {
        const respMessage: string = await resp.text();
        if (
          respMessage.includes(
            "Previous execution is still in progress - aborting"
          )
        ) {
          router.push(`/agreement/${agreement_id}/locked`);
          return;
        }
      }

      router.push("/500");
      return;
    }

    // Check still on switch agreement page, if not leave this function early and don't redirect to AppStream
    // If they're no longer on the page they probably have pressed the back button
    // With Next JS the function keeps running even if they change page
    if (windowLocationState.changed) return;

    // Quickly replace the current URL with the /[agreement_id] URL
    // so that when a user goes back they go to /[agreement_id] page, and don't get immediately logged back in
    window.history.replaceState(null, "", `/agreement/${agreement_id}`);

    const { redirect_url } = (await resp.json()) as { redirect_url: string };
    window.location.href = redirect_url;
  }, [router, agreement_id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { agreementLoadingState, switchAgreementCb };
};

interface AreYouSureProps {
  agreement_id: string;
  switchAgreementCb: () => void;
  notificationItems: Notice[];
}

const AreYouSurePage = ({
  agreement_id,
  switchAgreementCb: switchAgreement,
  notificationItems,
}: AreYouSureProps) => {
  const mainRef = useRef(null);
  return (
    <BasePage mainRef={mainRef} notificationItems={notificationItems}>
      <Head>
        <title>Confirm Agreement - SDE</title>
      </Head>
      <div style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <BackLink asElement={Link} href="/">
          Go back to home
        </BackLink>
        <main ref={mainRef}>
          <h1>Confirm your agreement selection</h1>
          <p className="nhsuk-lede-text">
            You are about to open the agreement {agreement_id}.
          </p>
          <WarningCallout>
            <h2 className="nhsuk-warning-callout__label">Warning</h2>
            <p>
              Switching agreements will close any open sessions, and any unsaved
              work will be lost.
            </p>
          </WarningCallout>
          <SwitchAgreementButton
            agreement_id={agreement_id}
            switchAgreementCb={switchAgreement}
          >
            Launch the virtual desktop
          </SwitchAgreementButton>
          <p style={{ marginTop: 30 }}>
            Continuing will open up the virtual desktop, where you can access
            the data, tools and services in your agreement.
          </p>
        </main>
      </div>
    </BasePage>
  );
};

interface LoadingProps {
  agreement_id: string;
}

function LoadingAgreement({ agreement_id }: LoadingProps) {
  const mainRef = useRef(null);

  return (
    <BasePage mainRef={mainRef}>
      <Head>
        <title>Loading Agreement - SDE</title>
      </Head>
      <main ref={mainRef} style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <BackLink asElement={Link} href={`../${agreement_id}`}>
          Go back
        </BackLink>
        <h1>Loading agreement {agreement_id}...</h1>
        <p>
          We are logging you into your agreement. Please wait, this process can
          take a few minutes.
        </p>
      </main>
    </BasePage>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const session = (await getServerSession(
    context.req,
    context.res,
    authOptions
  )) as Session;

  const inductionFeatureFlag = await hasFeatureFlagEnabledGivenContextReq({
    featureFlagName: INDUCTION_FEATURE_FLAG,
    context_req: context.req,
  });

  const results = await getUserAgreements(session.user?.email || "");

  if (
    inductionFeatureFlag &&
    results.inductionNeeded &&
    !results.inductionPassed
  ) {
    return {
      redirect: {
        destination: `/induction`,
        permanent: false,
      },
    };
  }

  const notificationItems = await getNotifications();
  const { activeAgreements } = results;

  const agreementCount = Object.keys(activeAgreements).length;

  return {
    props: {
      notificationItems,
      agreementCount,
    },
  };
};

export default SwitchAgreementPage;
