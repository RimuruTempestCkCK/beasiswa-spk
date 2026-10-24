import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AppFooter from './AppFooter';

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return (
        localStorage.getItem('registrar-sidebar') === 'collapsed' ||
        document.documentElement.classList.contains('sidebar-collapsed')
      );
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    const root = document.documentElement;
    root.classList.add('sidebar-anim');
    setTimeout(() => root.classList.remove('sidebar-anim'), 320);
    root.classList.toggle('sidebar-collapsed', next);
    try {
      localStorage.setItem('registrar-sidebar', next ? 'collapsed' : 'open');
    } catch {
      // storage unavailable
    }
  };

  useEffect(() => {
    if (isCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  return (
    <div className="app">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="app-main">
        <Topbar
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <main id="main" className="app-content" tabIndex={-1}>
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
