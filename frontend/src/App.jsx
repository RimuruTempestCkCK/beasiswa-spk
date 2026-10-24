import { Fragment, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route } from 'react-router';
import cx from 'classnames';

import AppMain from './Layout/AppMain';
import AppHeader from './Layout/AppHeader';
import AppSidebar from './Layout/AppSidebar';
import AppFooter from './Layout/AppFooter';
import ThemeOptions from './Layout/ThemeOptions';
import useDarkModeSync from './hooks/useDarkModeSync';
import LoginPage from './features/auth/LoginPage';

export default function App() {
  useDarkModeSync();
  const colorScheme = useSelector((s) => s.ThemeOptions.colorScheme);
  const enableFixedHeader = useSelector((s) => s.ThemeOptions.enableFixedHeader);
  const enableFixedSidebar = useSelector((s) => s.ThemeOptions.enableFixedSidebar);
  const enableFixedFooter = useSelector((s) => s.ThemeOptions.enableFixedFooter);
  const enableClosedSidebar = useSelector((s) => s.ThemeOptions.enableClosedSidebar);
  const enableMobileMenu = useSelector((s) => s.ThemeOptions.enableMobileMenu);
  const enablePageTabsAlt = useSelector((s) => s.ThemeOptions.enablePageTabsAlt);

  const token = useSelector((s) => s.auth?.token) || localStorage.getItem('access_token');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Fragment>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <ThemeOptions />
      <div>
        <div
          className={cx(
            'app-container app-theme-' + colorScheme,
            { 'fixed-header': enableFixedHeader },
            { 'fixed-sidebar': enableFixedSidebar || windowWidth < 992 },
            { 'fixed-footer': enableFixedFooter },
            { 'closed-sidebar': enableClosedSidebar || windowWidth < 992 },
            { 'closed-sidebar-mobile': windowWidth < 992 },
            { 'sidebar-mobile-open': enableMobileMenu },
            { 'body-tabs-shadow-btn': enablePageTabsAlt }
          )}
        >
          <AppHeader />
          <div className="app-main">
            <AppSidebar />
            <div className="app-main__outer">
              <main id="main-content" className="app-main__inner" tabIndex={-1}>
                <AppMain />
              </main>
              <AppFooter />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
