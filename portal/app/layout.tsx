import './style.scss';
import '../styles/NotificationBanner.css';

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { LayoutWrapper } from './layout/LayoutWrapper';
import SessionProviderWrapper from './layout/sessionProviderWrapper';

export const metadata: Metadata = {
  icons: {
    icon: { url: '/assets/favicons/favicon.png', sizes: '192x192' },
    shortcut: { url: '/assets/favicons/favicon.ico', type: 'image/x-icon' },
    apple: [
      {
        url: '/assets/favicons/apple-touch-icon.png',
        type: 'image/png',
      },
      {
        url: '/assets/favicons/apple-touch-icon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/assets/favicons/favicon.svg',
        color: '#005eb8',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSession = await getServerSession();

  return (
    <html lang='en'>
      <body>
        <SessionProviderWrapper initialSession={initialSession}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
