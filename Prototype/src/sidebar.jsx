/* Left sidebar — site switcher, project list, user menu with solution settings */

const Sidebar = ({
  projects, activeId, onSelect, onNew,
  onSite, siteActive,
  sites, activeSite, onSwitchSite, onNewSite, onSiteSettings,
  onSolutionSettings, solutionActive,
  onHelp, onAbout, onSignOut, onProfile,
  onProjectAction,
}) => {
  const [menuFor, setMenuFor] = React.useState(null);
  const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });
  const [siteOpen, setSiteOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);

  /* Group projects by lifecycle phase, not the legacy running/waiting/done
     status — closer to how teams actually talk about migration state. */
  const phaseOf = (p) => p.phase || (p.status === 'running' ? 'rehearsal' : p.status === 'waiting' ? 'planning' : 'done');
  const inSet = (arr) => (p) => arr.includes(phaseOf(p));
  const groups = [
    { key: 'active',   label: 'In progress',        items: projects.filter(inSet(['planning', 'analysis', 'rehearsal', 'sign-off'])) },
    { key: 'cutover',  label: 'Cutover · Hypercare', items: projects.filter(inSet(['cutover', 'hypercare'])) },
    { key: 'done',     label: 'Completed',           items: projects.filter(inSet(['done'])) },
  ];

  React.useEffect(() => {
    if (!menuFor && !siteOpen && !userOpen) return;
    const close = () => { setMenuFor(null); setSiteOpen(false); setUserOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', esc);
    };
  }, [menuFor, siteOpen, userOpen]);

  const openMenu = (e, projectId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.right + 4, y: rect.top });
    setMenuFor(projectId);
  };

  const site = sites?.find(s => s.id === activeSite) || sites?.[0];
  const siteName = site?.name || 'KDB Bank';
  const siteBadge = siteName.split(' ').map(w => w[0]).join('').slice(0,3).toUpperCase();

  return (
    <aside style={{
      width: 218,
      minWidth: 218,
      borderRight: '1px solid var(--border)',
      background: 'var(--panel)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      {/* App brand (no gear) */}
      <div style={{
        height: 36, padding: '0 12px',
        display: 'flex', alignItems: 'center', gap: 9,
        borderBottom: '1px solid var(--border)',
      }}>
        <img src="icon/mpd.png" alt="ModernizeProData" style={{ width: 18, height: 18, display: 'block', flexShrink: 0 }}/>
        <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: 0.1 }}>Modernize<span style={{ color: 'var(--text-3)' }}>ProData</span></div>
      </div>

      {/* Site switcher dropdown */}
      <div style={{ position: 'relative', borderBottom: '1px solid var(--border)' }}>
        <div
          onClick={(e) => { e.stopPropagation(); setSiteOpen(o => !o); }}
          style={{
            padding: '6px 12px',
            background: siteOpen ? 'var(--navy-50)' : 'var(--panel-2)',
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer',
          }}>
          <div style={{
            width: 18, height: 18, borderRadius: 3,
            background: 'var(--navy)', color: '#fff',
            display: 'grid', placeItems: 'center',
            fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: 0.4,
          }}>{siteBadge}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{siteName}</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{site?.env || 'on-prem'} · {(sites?.length || 1)} site{(sites?.length || 1) === 1 ? '' : 's'}</div>
          </div>
          <span style={{ color: 'var(--text-3)', fontSize: 9, transform: siteOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
        </div>

        {siteOpen && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', left: 6, right: 6, top: '100%',
              marginTop: 2, background: 'var(--panel)',
              border: '1px solid var(--border)', borderRadius: 4,
              boxShadow: '0 8px 24px rgba(20,30,50,.12)',
              zIndex: 500, padding: '4px 0',
            }}>
            <div style={{ padding: '4px 12px 3px', fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Sites</div>
            {(sites || []).map(s => {
              const isActive = s.id === site?.id;
              return (
                <button key={s.id}
                  onClick={() => { onSwitchSite?.(s.id); setSiteOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '6px 11px',
                    border: 'none', background: isActive ? 'var(--navy-50)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    fontSize: 11.5, color: isActive ? 'var(--navy)' : 'var(--text)',
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--panel-2)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3,
                    background: isActive ? 'var(--navy)' : 'var(--border)',
                    color: isActive ? '#fff' : 'var(--text-2)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 8, fontFamily: 'var(--mono)', fontWeight: 700,
                  }}>{s.name.split(' ').map(w => w[0]).join('').slice(0,3).toUpperCase()}</div>
                  <span style={{ flex: 1 }}>{s.name}</span>
                  {isActive && <span style={{ color: 'var(--navy)', fontSize: 10 }}>✓</span>}
                </button>
              );
            })}
            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }}/>
            <button
              onClick={() => { onNewSite?.(); setSiteOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '6px 11px',
                border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                fontSize: 11.5, color: 'var(--navy)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--panel-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: 16, textAlign: 'center', fontSize: 13 }}>+</span>
              <span>New site…</span>
            </button>
            <button
              onClick={() => { onSiteSettings?.(); setSiteOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '6px 11px',
                border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                fontSize: 11.5, color: 'var(--text-2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--panel-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>⚙</span>
              <span>Site settings…</span>
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '8px 10px 4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 22, padding: '0 7px',
          border: '1px solid var(--border)', borderRadius: 3,
          background: 'var(--panel-2)',
          color: 'var(--text-3)',
        }}>
          <Ic.search/>
          <input placeholder="Search projects…" style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 11.5, color: 'var(--text)',
          }}/>
        </div>
      </div>

      {/* All projects pinned item */}
      <div style={{ padding: '4px 6px 0' }}>
        <div
          onClick={onSite}
          style={{
            position: 'relative',
            padding: '6px 8px 6px 10px',
            margin: '0 2px',
            borderRadius: 3,
            cursor: 'pointer',
            border: siteActive ? '1px solid var(--border-strong)' : '1px solid transparent',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={e => { if (!siteActive) e.currentTarget.style.background = 'var(--panel-2)'; }}
          onMouseLeave={e => { if (!siteActive) e.currentTarget.style.background = 'transparent'; }}
        >
          {siteActive && <div style={{ position: 'absolute', left: -4, top: 4, bottom: 4, width: 2, background: 'var(--navy)', borderRadius: 1 }}/>}
          <div style={{
            width: 16, height: 16, borderRadius: 3,
            background: siteActive ? 'var(--navy)' : 'var(--border-strong)',
            display: 'grid', placeItems: 'center',
            color: siteActive ? '#fff' : 'var(--text-2)',
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect x="0" y="0" width="4" height="4"/><rect x="6" y="0" width="4" height="4"/><rect x="0" y="6" width="4" height="4"/><rect x="6" y="6" width="4" height="4"/></svg>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: siteActive ? 600 : 500, color: siteActive ? 'var(--navy)' : 'var(--text)', whiteSpace: 'nowrap' }}>All projects</span>
          <div style={{ flex: 1 }}/>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{projects.length}</span>
        </div>
      </div>

      {/* Section header */}
      <div style={{
        padding: '6px 12px 2px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7,
      }}>
        <span>Projects <span style={{ color: 'var(--text-4)' }}>{projects.length}</span></span>
        <button
          onClick={onNew}
          title="New project"
          style={{
            border: '1px solid var(--border)', background: 'var(--panel)',
            color: 'var(--text-2)', cursor: 'pointer',
            width: 18, height: 18, borderRadius: 3,
            display: 'grid', placeItems: 'center',
          }}><Ic.plus/></button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 4px 8px' }}>
        {projects.length === 0 && (
          <div style={{ padding: '16px 14px', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.55 }}>
            No projects yet. Click <span style={{ fontFamily: 'var(--mono)' }}>+</span> above to create one.
          </div>
        )}
        {groups.map(g => g.items.length > 0 && (
          <div key={g.key} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '3px 10px',
              fontSize: 9.5, fontFamily: 'var(--mono)',
              color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6,
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              <span>{g.label}</span>
              <span style={{ color: 'var(--text-4)' }}>{g.items.length}</span>
            </div>
            {g.items.map(p => {
              const active = p.id === activeId;
              const menuOpen = menuFor === p.id;
              return (
                <div key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="proj-row"
                  style={{
                    position: 'relative',
                    padding: '4px 8px 5px 10px',
                    margin: '1px 0',
                    borderRadius: 3,
                    cursor: 'pointer',
                    background: active ? 'var(--navy-50)' : 'transparent',
                    border: active ? '1px solid #c5d3e4' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {active && <div style={{ position: 'absolute', left: -4, top: 4, bottom: 4, width: 2, background: 'var(--navy)', borderRadius: 1 }}/>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 1 }}>
                    <StatusDot tone={p.status} size={7} ring={active}/>
                    <span style={{
                      fontSize: 11.5, fontWeight: active ? 600 : 500,
                      color: active ? 'var(--navy)' : 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1,
                    }}>{p.name}</span>
                    <button
                      className="proj-menu-btn"
                      onClick={(e) => openMenu(e, p.id)}
                      title="Project actions"
                      style={{
                        width: 16, height: 16, padding: 0,
                        border: 'none', borderRadius: 2,
                        background: menuOpen ? 'var(--navy)' : 'transparent',
                        color: menuOpen ? '#fff' : 'var(--text-3)',
                        cursor: 'pointer',
                        display: active || menuOpen ? 'grid' : 'none',
                        placeItems: 'center',
                        fontSize: 12, lineHeight: 1,
                      }}
                      onMouseEnter={e => { if (!menuOpen) { e.currentTarget.style.background = 'var(--panel-2)'; e.currentTarget.style.color = 'var(--text)'; } }}
                      onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
                    >⋯</button>
                  </div>
                  <div style={{
                    marginLeft: 14,
                    fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)',
                    display: 'flex', gap: 6, alignItems: 'center',
                  }}>
                    {p.phase && (
                      <span style={{
                        padding: '0 4px', borderRadius: 2, fontSize: 9, fontWeight: 600,
                        background: 'var(--panel-2)', color: 'var(--text-2)',
                        border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: 0.3,
                      }}>{(window.getPhaseLabel?.(p.phase) || p.phase)}</span>
                    )}
                    <span>{p.tables} tables</span>
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    <span>{p.updated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        .proj-row:hover .proj-menu-btn { display: grid !important; }
      `}</style>

      {/* Footer user with menu */}
      <div style={{ position: 'relative', borderTop: '1px solid var(--border)' }}>
        <div
          onClick={(e) => { e.stopPropagation(); setUserOpen(o => !o); }}
          style={{
            padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 11, cursor: 'pointer',
            background: userOpen ? 'var(--panel-2)' : 'transparent',
          }}
          onMouseEnter={e => { if (!userOpen) e.currentTarget.style.background = 'var(--panel-2)'; }}
          onMouseLeave={e => { if (!userOpen) e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--navy)', color: '#fff',
            display: 'grid', placeItems: 'center',
            fontSize: 9.5, fontWeight: 600,
          }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>Admin</div>
            <div style={{ color: 'var(--text-3)', fontSize: 10 }}>KS Info System</div>
          </div>
          <span style={{ color: 'var(--text-3)', fontSize: 9, transform: userOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▴</span>
        </div>

        {userOpen && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', left: 6, right: 6, bottom: '100%',
              marginBottom: 2, background: 'var(--panel)',
              border: '1px solid var(--border)', borderRadius: 4,
              boxShadow: '0 -8px 24px rgba(20,30,50,.12)',
              zIndex: 500, padding: '4px 0',
            }}>
            <div style={{ padding: '6px 11px 4px', borderBottom: '1px solid var(--border)', marginBottom: 3 }}>
              <div style={{ fontSize: 11, fontWeight: 600 }}>Admin</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>local account · Owner</div>
            </div>
            {[
              { k: 'profile',  l: 'Account profile',     icon: '👤' },
              { k: 'solution', l: 'Solution settings',   icon: '⚙',  active: solutionActive },
              { kind: 'divider' },
              { k: 'help',     l: 'Help & shortcuts',    icon: '?' },
              { k: 'about',    l: 'About ModernizeProData', icon: 'ⓘ' },
              { kind: 'divider' },
              { k: 'signout',  l: 'Sign out',            icon: '⎋' },
            ].map((it, i) => it.kind === 'divider' ? (
              <div key={i} style={{ height: 1, background: 'var(--border)', margin: '3px 0' }}/>
            ) : (
              <button key={it.k}
                onClick={() => {
                  setUserOpen(false);
                  if (it.k === 'solution') onSolutionSettings?.();
                  else if (it.k === 'profile') onProfile?.();
                  else if (it.k === 'help') onHelp?.();
                  else if (it.k === 'about') onAbout?.();
                  else if (it.k === 'signout') onSignOut?.();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '6px 11px',
                  border: 'none',
                  background: it.active ? 'var(--navy-50)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  fontSize: 11.5, color: it.active ? 'var(--navy)' : 'var(--text)',
                  fontWeight: it.active ? 600 : 500,
                }}
                onMouseEnter={e => { if (!it.active) e.currentTarget.style.background = 'var(--panel-2)'; }}
                onMouseLeave={e => { if (!it.active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: 14, textAlign: 'center', color: it.active ? 'var(--navy)' : 'var(--text-3)', fontSize: 11 }}>{it.icon}</span>
                <span style={{ flex: 1 }}>{it.l}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project context menu */}
      {menuFor && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: menuPos.x, top: menuPos.y,
            width: 170,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            boxShadow: '0 8px 24px rgba(20,30,50,.14)',
            padding: '3px 0',
            fontSize: 11.5,
            zIndex: 1000,
          }}>
          {[
            { k: 'open',      l: 'Open',              icon: '↗' },
            { k: 'rename',    l: 'Rename…',           icon: 'Aa' },
            { k: 'duplicate', l: 'Duplicate',         icon: '⎘' },
            { k: 'settings',  l: 'Settings',          icon: '⚙' },
            { kind: 'divider' },
            { k: 'export',    l: 'Export artifacts',  icon: '↓' },
            { kind: 'divider' },
            { k: 'delete',    l: 'Delete…',           icon: '✕', danger: true },
          ].map((it, i) => it.kind === 'divider' ? (
            <div key={i} style={{ height: 1, background: 'var(--border)', margin: '3px 0' }}/>
          ) : (
            <button
              key={it.k}
              onClick={() => { onProjectAction?.(it.k, menuFor); setMenuFor(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '5px 11px',
                border: 'none', background: 'transparent',
                color: it.danger ? 'var(--red)' : 'var(--text)',
                cursor: 'pointer', textAlign: 'left',
                fontSize: 11.5,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = it.danger ? 'var(--red-50)' : 'var(--panel-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: 14, textAlign: 'center', color: it.danger ? 'var(--red)' : 'var(--text-3)', fontFamily: it.icon === 'Aa' ? 'var(--sans)' : 'var(--mono)', fontSize: 10.5 }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.l}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};

window.Sidebar = Sidebar;
