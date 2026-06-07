import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const links = [
  { to: '/pos', label: 'POS', short: 'P' },
  { to: '/products', label: 'Ürünler', short: 'Ü' },
  { to: '/sales', label: 'Satışlar', short: 'S' },
  { to: '/reports', label: 'Raporlar', short: 'R' }
];

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    navigate('/login', { replace: true });
  };

  return (
    <div className={sidebarOpen ? 'app-shell sidebar-open' : 'app-shell sidebar-collapsed'}>
      <button
        className="sidebar-overlay"
        aria-label="Menüyü kapat"
        onClick={() => setSidebarOpen(false)}
        type="button"
      />

      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">HS</span>
          <div className="brand-text">
            <h1>Hızlı Satış</h1>
            <p>Market POS</p>
          </div>
        </div>

        <nav className="main-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setSidebarOpen(false)}>
              <span className="nav-short">{link.short}</span>
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </aside>

      <main className="content-area">
        <header className="app-topbar">
          <button
            className="menu-toggle"
            aria-label={sidebarOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setSidebarOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <strong>Hızlı Satış POS</strong>
            <span>Kasiyer ekranı</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
