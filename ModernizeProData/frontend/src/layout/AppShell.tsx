import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { BrandName } from '../components/BrandName';
import { AboutModal } from '../components/AboutModal';
import { HelpModal } from '../components/HelpModal';
import { AccountProfileModal } from '../components/AccountProfileModal';
import { SolutionSettingsModal } from '../components/SolutionSettingsModal';

/**
 * Prototype 의 메인 셸 (사이드바 + 탑바 + 탭바) 을 그대로 구현.
 * 데이터(프로젝트·사이트·알림)는 아직 없어 placeholder 로 채움.
 */
export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userOpen, setUserOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userOpen) return;
    const close = (e: MouseEvent) => {
      if (!userRef.current?.contains(e.target as Node)) setUserOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [userOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.wrap}>
      {sidebarOpen && (
        <aside style={styles.sidebar}>
          {/* 브랜드 */}
          <div style={styles.brandRow}>
            <img src="/mpd.png" alt="" width={18} height={18} style={{ display: 'block', flexShrink: 0 }} />
            <div style={styles.brand}><BrandName /></div>
          </div>

          {/* 사이트 selector */}
          <div style={styles.siteRow}>
            <div style={styles.siteBadge}>KS</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={styles.siteName}>KS Info System</div>
              <div style={styles.siteSub}>on-prem · 1 site</div>
            </div>
            <span style={styles.siteChevron}>▼</span>
          </div>

          {/* Search */}
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input style={styles.searchInput} placeholder="Search projects..." />
          </div>

          {/* All projects */}
          <div style={styles.allProjects}>
            <div style={styles.allProjectsIcon}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
                <rect x="0" y="0" width="4" height="4" />
                <rect x="6" y="0" width="4" height="4" />
                <rect x="0" y="6" width="4" height="4" />
                <rect x="6" y="6" width="4" height="4" />
              </svg>
            </div>
            <span style={styles.allProjectsLabel}>All projects</span>
            <div style={{ flex: 1 }} />
            <span style={styles.countMono}>0</span>
          </div>

          {/* Projects section */}
          <div style={styles.sectionHeader}>
            <span>Projects <span style={styles.muted}>0</span></span>
            <button title="New project" style={styles.iconBtn}>+</button>
          </div>

          <div style={styles.projectList}>
            <div style={styles.emptyState}>
              No projects yet. Click <code style={styles.kbd}>+</code> above to create one.
            </div>
          </div>

          {/* 사용자 메뉴 (하단) */}
          <div ref={userRef} style={styles.userArea}>
            {userOpen && (
              <div style={styles.userMenu}>
                <div style={styles.userMenuHeader}>
                  <div style={styles.userMenuName}>{user?.username}</div>
                  <div style={styles.userMenuSub}>local account · {user?.role}</div>
                </div>
                <MenuItem
                  icon={<IconProfile />}
                  label="Account profile"
                  onClick={() => { setUserOpen(false); setProfileOpen(true); }}
                />
                {user?.role === 'master' && (
                  <MenuItem
                    icon={<IconGear />}
                    label="Solution settings"
                    onClick={() => { setUserOpen(false); setSolutionOpen(true); }}
                  />
                )}
                <div style={styles.userMenuDivider} />
                <MenuItem
                  icon={<IconHelp />}
                  label="Help & shortcuts"
                  onClick={() => { setUserOpen(false); setHelpOpen(true); }}
                />
                <MenuItem
                  icon={<IconAbout />}
                  label={<>About <BrandName /></>}
                  onClick={() => { setUserOpen(false); setAboutOpen(true); }}
                />
                <div style={styles.userMenuDivider} />
                <MenuItem
                  icon={<IconSignout />}
                  label="Sign out"
                  onClick={() => { setUserOpen(false); handleLogout(); }}
                />
              </div>
            )}
            <div
              onClick={(e) => { e.stopPropagation(); setUserOpen((o) => !o); }}
              style={{ ...styles.userRow, ...(userOpen ? styles.userRowActive : {}) }}
            >
              <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase() ?? '?'}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={styles.userName}>{user?.username}</div>
                <div style={styles.userSub}>KS Info System</div>
              </div>
              <span style={styles.userChevron}>▾</span>
            </div>
          </div>
        </aside>
      )}

      <main style={styles.main}>
        {/* 탑바 */}
        <div style={styles.topbar}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            style={styles.collapseBtn}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="1.5" y="1.5" width="11" height="11" rx="1" />
              <line x1="5.5" y1="1.5" x2="5.5" y2="12.5" />
            </svg>
          </button>

          <div style={styles.topTitle}>
            <div style={styles.topTitleMain}>
              <BrandName />
            </div>
            <div style={styles.topTitleSub}>
              데이터 이행 도구 · Coordinator
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* 알림 bell */}
          <button title="Notifications" style={styles.bellBtn}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M8 1.5a4 4 0 0 0-4 4v3l-1.5 2.5h11L12 8V5.5a4 4 0 0 0-4-4z" />
              <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" />
            </svg>
          </button>

          {/* AS-IS / TO-BE 인디케이터 (placeholder) */}
          <button title="AS-IS status (placeholder)" style={styles.statusPill}>
            <span style={{ ...styles.dot, background: 'var(--text-4)' }} />
            <span style={{ ...styles.dot, background: 'var(--text-4)' }} />
            <span>AS-IS</span>
          </button>
          <button title="TO-BE status (placeholder)" style={styles.statusPill}>
            <span style={{ ...styles.dot, background: 'var(--text-4)' }} />
            <span>TO-BE</span>
          </button>
        </div>

        {/* 탭바 */}
        <div style={styles.tabbar}>
          <Tab to="/" end label="Dashboard" />
          <Tab to="/mapping" label="Mapping" />
          <Tab to="/versions" label="Versions" />
          <Tab to="/execution" label="Execution" />
          <Tab to="/artifacts" label="Artifacts" />
          <Tab to="/logs" label="Log viewer" />
          <Tab to="/settings" label="Settings" gear />
        </div>

        <div style={styles.content}>
          <Outlet />
        </div>
      </main>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AccountProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SolutionSettingsModal open={solutionOpen} onClose={() => setSolutionOpen(false)} />
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={styles.userMenuItem}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--panel-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={styles.userMenuIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/* ─── Menu icons (inline SVG) ──────────────────────── */
function IconProfile() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6d4ec2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="4.5" r="2.5" />
      <path d="M2.5 12.5c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--navy)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2.2" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.5 2.5l1.1 1.1M10.4 10.4l1.1 1.1M2.5 11.5l1.1-1.1M10.4 3.6l1.1-1.1" />
    </svg>
  );
}
function IconHelp() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M5.3 5.3a1.7 1.7 0 0 1 3.4.2c0 1.2-1.7 1.4-1.7 2.5" />
      <circle cx="7" cy="10.3" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconAbout() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 6v4M7 4v.1" />
    </svg>
  );
}
function IconSignout() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--red)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 3V2a1 1 0 0 0-1-1H2.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1" />
      <path d="M6 7h6.5M10.5 4.5 13 7l-2.5 2.5" />
    </svg>
  );
}

function Tab({ to, end, label, gear }: { to: string; end?: boolean; label: string; gear?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        position: 'relative',
        padding: '0 13px',
        height: '100%',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        cursor: 'pointer',
        color: isActive ? 'var(--navy)' : 'var(--text-2)',
        fontWeight: isActive ? 600 : 500,
        fontSize: 12,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        transition: 'color .08s',
        boxShadow: isActive ? 'inset 0 -2px 0 var(--navy)' : 'none',
      })}
    >
      {label}
      {gear && <span style={{ fontSize: 10, color: 'var(--text-4)' }}>⚙</span>}
    </NavLink>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    height: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
  },

  /* ── Sidebar ─────────────────────────────────── */
  sidebar: {
    width: 270,
    minWidth: 270,
    background: 'var(--panel)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  brandRow: {
    height: 38,
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    borderBottom: '1px solid var(--border)',
  },
  brand: {
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  siteRow: {
    padding: '8px 12px',
    background: 'var(--panel-2)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  siteBadge: {
    width: 22,
    height: 22,
    borderRadius: 3,
    background: 'var(--navy)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 9,
    fontFamily: 'var(--mono)',
    fontWeight: 700,
    letterSpacing: 0.4,
    flexShrink: 0,
  },
  siteName: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  siteSub: {
    fontSize: 10,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
  },
  siteChevron: { color: 'var(--text-3)', fontSize: 9 },

  searchWrap: {
    padding: '8px 10px',
    borderBottom: '1px solid var(--border)',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 11,
    color: 'var(--text-4)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: 24,
    padding: '0 8px 0 24px',
    border: '1px solid var(--border)',
    borderRadius: 4,
    background: 'var(--panel)',
    color: 'var(--text)',
    fontSize: 11.5,
    outline: 'none',
  },

  allProjects: {
    padding: '7px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
  },
  allProjectsIcon: {
    width: 18,
    height: 18,
    borderRadius: 3,
    background: 'var(--border-strong)',
    color: 'var(--text-2)',
    display: 'grid',
    placeItems: 'center',
  },
  allProjectsLabel: { fontSize: 11.5, fontWeight: 500, color: 'var(--text)' },
  countMono: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' },

  sectionHeader: {
    padding: '8px 14px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 10,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: 600,
  },
  muted: { color: 'var(--text-4)' },
  iconBtn: {
    width: 18,
    height: 18,
    borderRadius: 3,
    border: '1px solid var(--border)',
    background: 'var(--panel)',
    color: 'var(--text-2)',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontSize: 12,
    lineHeight: 1,
    padding: 0,
  },

  projectList: { flex: 1, overflow: 'auto', padding: '0 4px 8px' },
  emptyState: {
    padding: '16px 14px',
    fontSize: 11,
    color: 'var(--text-3)',
    lineHeight: 1.55,
  },
  kbd: {
    fontFamily: 'var(--mono)',
    background: 'var(--panel-2)',
    padding: '0 4px',
    borderRadius: 2,
    fontSize: 10,
  },

  /* User area (sidebar bottom) */
  userArea: {
    position: 'relative',
    borderTop: '1px solid var(--border)',
    background: 'var(--panel)',
  },
  userRow: {
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    cursor: 'pointer',
  },
  userRowActive: { background: 'var(--panel-2)' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'var(--navy)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: { fontSize: 12, fontWeight: 600, color: 'var(--text)' },
  userSub: { fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' },
  userRole: {
    fontSize: 9,
    color: 'var(--navy)',
    padding: '1px 5px',
    background: 'var(--navy-50)',
    border: '1px solid var(--navy)',
    borderRadius: 3,
    fontFamily: 'var(--mono)',
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  userMenu: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: '100%',
    marginBottom: 4,
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    boxShadow: '0 8px 24px rgba(20,30,50,.12)',
    padding: '4px 0',
    zIndex: 500,
  },
  userMenuHeader: {
    padding: '8px 12px 10px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 4,
  },
  userMenuName: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  userMenuSub: {
    fontSize: 10.5,
    color: 'var(--text-3)',
    fontFamily: 'var(--mono)',
    marginTop: 2,
  },
  userMenuItem: {
    width: '100%',
    padding: '7px 11px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    textAlign: 'left',
    fontSize: 12,
    display: 'flex',
    gap: 9,
    alignItems: 'center',
    cursor: 'pointer',
  },
  userMenuIcon: {
    width: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userMenuDivider: {
    height: 1,
    margin: '3px 0',
    background: 'var(--border)',
  },
  userChevron: {
    color: 'var(--text-3)',
    fontSize: 9,
    marginLeft: 4,
  },

  /* ── Main ───────────────────────────────────── */
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },

  topbar: {
    height: 48,
    padding: '0 14px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--panel)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  collapseBtn: {
    width: 26,
    height: 26,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--text-2)',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
  topTitle: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 },
  topTitleMain: { fontSize: 13, fontWeight: 600, letterSpacing: -0.1 },
  topTitleSub: { fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' },

  bellBtn: {
    width: 28,
    height: 28,
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    color: 'var(--text-2)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 9px',
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 10.5,
    color: 'var(--text-2)',
    fontFamily: 'var(--mono)',
  },
  dot: { width: 5, height: 5, borderRadius: '50%' },

  tabbar: {
    display: 'flex',
    alignItems: 'stretch',
    padding: '0 12px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--panel)',
    height: 30,
  },

  content: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    background: 'var(--bg)',
    padding: 18,
  },
};
