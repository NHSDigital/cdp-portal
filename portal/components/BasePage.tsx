import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Button,
  Container,
  Footer,
  SkipLink,
  WarningCallout,
} from "nhsuk-react-components";
import React, { useEffect, useState } from "react";
import style from "../styles/BasePage.module.css";
import { Notice } from "../services/getNotifications";
import NotificationBanner from "../components/NotificationsBanner";

type Props = {
  children: React.ReactNode;
  mainRef: React.MutableRefObject<any>;
  notificationItems?: Notice[];
};

export default function BasePage({
  children,
  mainRef,
  notificationItems = [],
}: Props) {
  const router = useRouter();
  useLogoutIfSessionExpires(router);

  return (
    <>
      <SkipLink focusTargetRef={mainRef} />

      <div className={style.fullPageHeight}>
        <Header />
        <Container>
          <noscript>
            <WarningCallout>
              <WarningCallout.Label>
                JavaScript Not Enabled
              </WarningCallout.Label>
              <p>
                JavaScript is not enabled on your browser, you may have a worse
                browsing experience as a result. Furthermore, the virtual
                desktop does not work without JavaScript.
              </p>
            </WarningCallout>
          </noscript>
          {notificationItems.map((notice) => (
            <NotificationBanner
              notification={notice.notification}
              colour={notice.colour}
              key={notice.noticeId}
            />
          ))}
          {children}
        </Container>
      </div>
      <Footer>
        <Footer.List>
          <Footer.ListItem href="https://www.nhs.uk/nhs-sites/">
            NHS sites
          </Footer.ListItem>
          <Footer.ListItem href="https://www.nhs.uk/about-us/">
            About us
          </Footer.ListItem>
          <Footer.ListItem href="https://www.nhs.uk/contact-us/">
            Contact us
          </Footer.ListItem>
          <Footer.ListItem href="https://digital.nhs.uk/services/secure-data-environment-service/log-in/user-guides/accessibility-statement/">
            Accessibility statement (opens in a new window)
          </Footer.ListItem>
          <Footer.ListItem href="https://www.nhs.uk/our-policies/">
            Our policies
          </Footer.ListItem>
        </Footer.List>
        <Footer.Copyright>&copy; Crown copyright</Footer.Copyright>
      </Footer>
    </>
  );
}

function Header() {
  return (
    <header className="nhsuk-header" role="banner">
      <div
        className="nhsuk-width-container nhsuk-header__container"
        style={{ justifyContent: "space-between", display: "flex" }}
      >
        <div className="nhsuk-header__logo">
          <Link
            className="nhsuk-header__link nhsuk-header__link--service "
            href="/"
            aria-label="SDE homepage"
          >
            <svg
              className="nhsuk-logo"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 40 16"
              height="40"
              width="100"
              role="img"
              aria-label="NHS Logo"
            >
              <path
                className="nhsuk-logo__background"
                fill="#005eb8"
                d="M0 0h40v16H0z"
              ></path>
              <path
                className="nhsuk-logo__text"
                fill="#fff"
                d="M3.9 1.5h4.4l2.6 9h.1l1.8-9h3.3l-2.8 13H9l-2.7-9h-.1l-1.8 9H1.1M17.3 1.5h3.6l-1 4.9h4L25 1.5h3.5l-2.7 13h-3.5l1.1-5.6h-4.1l-1.2 5.6h-3.4M37.7 4.4c-.7-.3-1.6-.6-2.9-.6-1.4 0-2.5.2-2.5 1.3 0 1.8 5.1 1.2 5.1 5.1 0 3.6-3.3 4.5-6.4 4.5-1.3 0-2.9-.3-4-.7l.8-2.7c.7.4 2.1.7 3.2.7s2.8-.2 2.8-1.5c0-2.1-5.1-1.3-5.1-5 0-3.4 2.9-4.4 5.8-4.4 1.6 0 3.1.2 4 .6"
              ></path>
            </svg>

            <span className="nhsuk-header__service-name">
              Secure Data Environment Service
            </span>
          </Link>
        </div>

        <div className="nhsuk-header__content" id="content-header">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export function useLogoutIfSessionExpires(router) {
  const session = useSession();
  const [wasLoggedInBefore, setWasLoggedInBefore] = useState(!!session.data);

  useEffect(() => {
    if (session.data && !wasLoggedInBefore) {
      setWasLoggedInBefore(true);
      return;
    }

    if (
      !session.data &&
      wasLoggedInBefore &&
      window.location.pathname !== "/welcome"
    ) {
      router.push(
        `/welcome?callbackUrl=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
    }
  }, [session.data]); // eslint-disable-line react-hooks/exhaustive-deps
}

function LogoutButton() {
  const [firstRender, setFirstRender] = useState(true);
  useEffect(() => {
    setFirstRender(false);
  }, [setFirstRender]);

  const session = useSession();

  const [isLoading, setIsLoading] = useState(false);

  if (!session.data && !firstRender) return null;

  const onLogoutSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const resp = await fetch("/api/signout", {
      method: "POST",
    });

    const callbackUrl = resp.status === 204 ? "/logout_confirm" : "/500";

    await signOut({ callbackUrl });
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      {session.data && (
        <span
          style={{
            color: "#fff",
            padding: "2px 0",
            marginLeft: 15,
            marginRight: 15,
            wordWrap: "break-word",
            wordBreak: "break-all",
          }}
        >
          Logged in as {session.data?.user?.name}
        </span>
      )}
      <form method="POST" action="/api/signout" onSubmit={onLogoutSubmit}>
        <Button
          reverse
          // @ts-ignore
          as="input"
          type="submit"
          className={style.logoutButton}
          style={{ padding: "2px 15px" }}
          disabled={isLoading}
        >
          Logout
        </Button>
      </form>
    </div>
  );
}
