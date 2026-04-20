import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Shield, AlertTriangle, LayoutDashboard,
  Database, Send, Bell, Menu, X, Clock,
  TrendingUp, Users, Zap, BarChart3, Settings,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import ZoneGrid from './components/ZoneGrid';
import WhatIfPanel from './components/WhatIfPanel';
import AlertFeed from './components/AlertFeed';
import LiveStatsTable from './components/LiveStatsTable';
import { Toaster } from 'react-hot-toast';

/* ── Sidebar navigation items ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',   icon: LayoutDashboard, label: 'Overview',       section: 'main' },
  { id: 'density',    icon: Activity,         label: 'Live Density',   section: 'main', badge: 2 },
  { id: 'analytics',  icon: BarChart3,        label: 'Analytics',      section: 'main' },
  { id: 'alerts',     icon: Bell,             label: 'Alert Management', section: 'main', badge: 5 },
  { id: 'data',       icon: Database,         label: 'BigQuery Logs',  section: 'infra' },
  { id: 'events',     icon: Send,             label: 'Pub/Sub Events', section: 'infra' },
  { id: 'settings',   icon: Settings,         label: 'Settings',       section: 'system' },
];

/* ── Top KPI data ─────────────────────────────────────────────────────── */
const STATS = [
  { id: 's1', label: 'Active Zones',    value: '12',     delta: '+2',  up: true,  color: '#F59E0B', icon: Activity,    iconBg: 'rgba(245,158,11,0.12)'  },
  { id: 's2', label: 'Total Attendees', value: '24,851', delta: '+312',up: true,  color: '#10B981', icon: Users,       iconBg: 'rgba(16,185,129,0.12)'  },
  { id: 's3', label: 'Alerts Today',    value: '37',     delta: '+8',  up: false, color: '#FF4D4D', icon: AlertTriangle, iconBg: 'rgba(255,77,77,0.12)' },
  { id: 's4', label: 'Notifications',   value: '1,209',  delta: '+94', up: true,  color: '#FB923C', icon: Zap,         iconBg: 'rgba(251,146,60,0.12)'  },
];

export default function App() {
  const [time, setTime]           = useState(new Date());
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const navBySection = (section) => NAV_ITEMS.filter(n => n.section === section);

  return (
    <div className="app-shell scanline grid-bg">
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#101C1F', color: '#EFF4F5', border: '1px solid rgba(245,158,11,0.2)', fontFamily: 'Inter, sans-serif' } }}
      />

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Shield size={22} color="#060A0B" strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">Venue<span>IQ</span></div>
            <div className="logo-sub">Ops Control</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {[
            { key: 'main',   label: 'Dashboard'    },
            { key: 'infra',  label: 'Infrastructure'},
            { key: 'system', label: 'System'        },
          ].map(({ key, label }) => (
            <div key={key} className="nav-section">
              <div className="nav-label">{label}</div>
              {navBySection(key).map(({ id, icon: Icon, label: lbl, badge }) => (
                <button
                  key={id}
                  id={`nav-${id}`}
                  className={`nav-item ${activeNav === id ? 'active' : ''}`}
                  onClick={() => { setActiveNav(id); setSidebar(false); }}
                >
                  <Icon size={16} />
                  {lbl}
                  {badge && <span className="nav-badge">{badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer health card */}
        <div className="sidebar-footer">
          <div className="health-card">
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10B981', marginBottom: 8 }}>
              System Health
            </p>
            {['Ingestion', 'Prediction', 'Notification'].map(svc => (
              <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulseGlow 2s infinite' }} />
                <span style={{ fontSize: 11, color: '#6B9DA3' }}>{svc}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#10B981', fontWeight: 600 }}>LIVE</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              id="sidebar-toggle"
              onClick={() => setSidebar(!sidebarOpen)}
              style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
              className="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div>
              <div className="topbar-title">Command Dashboard</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                <span style={{ color: 'var(--text-amber)' }}>●</span> Real-time · Auto-refresh 3s
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button
              id="refresh-btn"
              className="btn-ghost"
              onClick={handleRefresh}
              style={{ padding: '8px 14px' }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <div className="topbar-clock number-display">
                <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div style={{ width: 1, height: 32, background: 'var(--border-subtle)' }} />

            <div className="topbar-avatar" id="avatar-btn" title="Operator">OP</div>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          <div style={{ maxWidth: 1600, margin: '0 auto' }}>

            {/* ── KPI Strip ─────────────────────────────────────────── */}
            <div className="stat-grid animate-fade-up" style={{ marginBottom: 28 }}>
              {STATS.map(({ id, label, value, delta, up, color, icon: Icon, iconBg }) => (
                <div key={id} id={id} className="stat-card" style={{ '--card-glow': `${color}14` }}>
                  <div className="stat-icon" style={{ '--icon-bg': iconBg, '--icon-color': color }}>
                    <Icon size={18} />
                  </div>
                  <div className="stat-label">{label}</div>
                  <div className="stat-value number-display" style={{ color }}>{value}</div>
                  <div className={`stat-delta ${up ? 'delta-up' : 'delta-down'}`}>
                    <TrendingUp size={12} style={{ transform: up ? 'none' : 'scaleY(-1)' }} />
                    {delta} since last hour
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main grid ─────────────────────────────────────────── */}
            <div className="dashboard-grid">
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Zone Density */}
                <section className="glass" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                      <Activity size={18} color="var(--text-amber)" />
                      Live Zone Density
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="section-badge">Auto-refresh 3s</span>
                      <span className="tag tag-amber">12 Zones</span>
                    </div>
                  </div>
                  <ZoneGrid />
                </section>

                {/* What-If Simulation */}
                <section className="glass" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                      <Zap size={18} color="var(--text-amber)" />
                      Predictive Simulation
                    </h2>
                    <span className="tag tag-amber">ST-GAT Model</span>
                  </div>
                  <WhatIfPanel />
                </section>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Alert Feed */}
                <section className="glass" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                      <AlertTriangle size={18} color="var(--text-amber)" />
                      Incident Feed
                    </h2>
                    <span className="tag tag-red">5 Active</span>
                  </div>
                  <AlertFeed />
                </section>

                {/* Live Stats Table */}
                <section className="glass" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                      <BarChart3 size={18} color="var(--text-amber)" />
                      Zone Performance
                    </h2>
                    <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
                      Export <ChevronRight size={12} />
                    </button>
                  </div>
                  <LiveStatsTable />
                </section>

              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>VenueIQ Ops Control © 2026</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Cloud Run', 'Pub/Sub', 'BigQuery'].map(svc => (
              <span key={svc} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                {svc}
              </span>
            ))}
          </div>
        </footer>
      </div>

      {/* Global spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width:1200px) { .mobile-menu-btn { display:flex !important; } }
      `}</style>
    </div>
  );
}
