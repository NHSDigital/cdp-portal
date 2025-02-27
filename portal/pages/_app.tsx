import React from "react";
import "../styles/nhsuk-6.2.0.min.css";
import "../styles/style.css";
import "../styles/NotificationBanner.css";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
