import style from '@/styles/BasePage.module.css';

import Footer from './footer';
import Header from './header';
import NoScriptWarning from './noScriptWarning';
import Notifications from './notifications';

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className='nhsuk-skip-link' href='#maincontent'>
        Skip to main content
      </a>
      <div className={style.fullPageHeight}>
        <Header />
        <div className='nhsuk-width-container'>
          <Notifications />
          <NoScriptWarning />
          <main className='nhsuk-main-wrapper' id='maincontent'>
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}

export { LayoutWrapper };
