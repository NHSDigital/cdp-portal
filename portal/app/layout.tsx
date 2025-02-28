import "./style.scss";
import "../styles/NotificationBanner.css";
import Header from "./layout/header";
import Footer from "./layout/footer";
import SessionProviderWrapper from "./layout/sessionProviderWrapper";
import { getServerSession } from "next-auth";
import NoScriptWarning from "./layout/noScriptWarning";
import Notifications from "./layout/notifications";

export const metadata = {
  title: {
    template: "%s - SDE",
    default: "SDE Web Portal",
  },
  description: "NHS Secure Data Environment",
  icons: {
    icon: "/assets/favicons/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSession = await getServerSession();

  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper initialSession={initialSession}>
          <a className="nhsuk-skip-link" href="#maincontent">
            Skip to main content
          </a>
          <div>
            <Header />
            <div className="nhsuk-width-container">
              <Notifications />
              <NoScriptWarning />
              <main
                className="nhsuk-main-wrapper nhsuk-u-padding-top-4"
                id="maincontent"
              >
                {children}
              </main>
            </div>
          </div>
          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
