/* App shell — topbar, tabs, routing between tabs */

const DEFAULT_SITES = [
  { id: 's1', name: 'KDB Bank',    env: 'Mainframe',     envDetail: 'z/OS 2.5 · EBCDIC',     dbKind: 'PostgreSQL', dbVer: '15.4' },
  { id: 's2', name: 'NH Insurance', env: 'AS/400 · IBM i', envDetail: 'IBM i 7.4 · EBCDIC-KO', dbKind: 'Tibero',     dbVer: '7.1' },
  { id: 's3', name: 'KT Telecom',   env: 'Unix · Oracle',  envDetail: 'Solaris 11 · AL32UTF8', dbKind: 'PostgreSQL', dbVer: '15.4' },
];

const App = () => {
  const [activeProject, setActiveProject] = React.useState('p1');
  const [view, setView] = React.useState('project'); // 'site' | 'project' | 'sitesettings'
  const [tab, setTab] = React.useState('dashboard');
  const [sites, setSites] = React.useState(DEFAULT_SITES);
  const [activeSite, setActiveSite] = React.useState('s1');

  React.useEffect(() => {
    if (view === 'site' && tab !== 'overview' && tab !== 'export') setTab('overview');
    if (view === 'project' && (tab === 'overview')) setTab('dashboard');
  }, [view]);

  /* Sync the legacy globals (window.SCHEMA_DIFF / TABLES / LOG_LINES /
     QUARANTINE_ENTRIES) to whichever project is active. Many components
     still read from those globals directly; this keeps them per-project.
     Done both synchronously during render (so child components observe the
     correct values immediately) and via effect (defensive — runs once after
     mount even if the synchronous call was skipped). */
  if (window.getActiveDataProject?.() !== activeProject) {
    window.setActiveDataProject?.(activeProject);
  }
  React.useEffect(() => {
    window.setActiveDataProject?.(activeProject);
  }, [activeProject]);
  const [theme, setTheme] = React.useState(window.APP_PREFS?.theme || 'light');
  const [projects, setProjects] = React.useState(PROJECTS);
  const [showNew, setShowNew] = React.useState(false);
  const [showNewSite, setShowNewSite] = React.useState(false);
  const [overlay, setOverlay] = React.useState(null); // 'profile' | 'help' | 'about' | 'signout' | 'signedout' | 'solutionsettings' | null
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [settingsSection, setSettingsSection] = React.useState('general');
  const [notifications, setNotifications] = React.useState(() => window.getNotifications?.() || []);
  /* Solution Settings 의 마스터 알림 토글 — off 면 모든 프로젝트의 인앱 알림이
     일괄 비활성화되고, Project Settings › Notifications 화면의 이벤트 구독 항목도
     모두 disabled 로 표시된다. */
  const [notifEnabled, setNotifEnabled] = React.useState(true);
  /* Preflight Fix deep-link target — { side, internalName, tobeName, colName }.
     Set when user clicks Fix on a preflight check; consumed by Mapping/Settings
     to auto-select + pulse the offending row. Cleared after ~3s. */
  const [fixTarget, setFixTarget] = React.useState(null);

  /* VSCode-style sidebar toggle — Ctrl/Cmd+B */
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.shiftKey && !e.altKey) {
        const tag = (e.target?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
        e.preventDefault();
        setSidebarOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const project = projects.find(p => p.id === activeProject) || projects[0];
  const site = sites.find(s => s.id === activeSite) || sites[0];

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* Per-project data — resolved fresh on every render so tab badges and
     children reflect the currently selected project. */
  const projectTables   = window.getTablesByProject?.(activeProject) || [];
  const projectSchema   = window.getSchemaDiffByProject?.(activeProject) || [];
  const projectLogLines = window.getLogLines?.(activeProject) || [];

  const snapshotCount = (window.getSnapshots?.(activeProject) || []).length;
  const tabs = [
    { k: 'dashboard', l: 'Dashboard', c: `${projectTables.length} tables` },
    { k: 'mapping',   l: 'Mapping', c: `${MAPPING.length} fields` },
    { k: 'versions',  l: 'Versions', c: snapshotCount > 0 ? `${snapshotCount}` : '—' },
    { k: 'execution', l: 'Execution', c: 'live' },
    { k: 'artifacts', l: 'Artifacts', c: `${projectSchema.length * 5 + 1}` },
    { k: 'logs',      l: 'Log viewer', c: `${projectLogLines.length}` },
    { k: 'settings',  l: 'Settings', c: '⚙' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <div style={{
        width: sidebarOpen ? 218 : 0,
        minWidth: sidebarOpen ? 218 : 0,
        overflow: 'hidden',
        transition: 'width .18s ease, min-width .18s ease',
        display: 'flex', flexShrink: 0,
      }}>
      <Sidebar projects={projects} activeId={view === 'site' ? null : activeProject}
        siteActive={view === 'site'}
        sites={sites} activeSite={activeSite}
        onSwitchSite={(id) => setActiveSite(id)}
        onNewSite={() => setShowNewSite(true)}
        onSiteSettings={() => setView('sitesettings')}
        onSolutionSettings={() => setOverlay('solutionsettings')}
        solutionActive={overlay === 'solutionsettings'}
        onProfile={() => setOverlay('profile')}
        onHelp={() => setOverlay('help')}
        onAbout={() => setOverlay('about')}
        onSignOut={() => setOverlay('signout')}
        onSite={() => { setView('site'); setTab('overview'); }}
        onSelect={(id) => { setActiveProject(id); setView('project'); }}
        onNew={() => setShowNew(true)}
        onProjectAction={(action, id) => {
          if (action === 'open') { setActiveProject(id); setView('project'); setTab('dashboard'); }
          else if (action === 'settings') { setActiveProject(id); setView('project'); setTab('settings'); }
          else if (action === 'rename') {
            const p = projects.find(x => x.id === id);
            const nn = prompt('Rename project', p?.name); if (nn) setProjects(list => list.map(x => x.id === id ? { ...x, name: nn } : x));
          }
          else if (action === 'duplicate') {
            const p = projects.find(x => x.id === id); if (!p) return;
            const copy = { ...p, id: 'p' + Date.now(), name: p.name + ' (copy)', status: 'waiting', isNew: true };
            setProjects(list => [copy, ...list]); setActiveProject(copy.id); setView('project');
          }
          else if (action === 'export') { alert('Exporting artifacts bundle for ' + id + '…'); }
          else if (action === 'delete') {
            if (confirm('Delete this project permanently? This cannot be undone.')) {
              setProjects(list => list.filter(x => x.id !== id));
              if (activeProject === id && projects.length > 1) setActiveProject(projects.find(x => x.id !== id).id);
            }
          }
        }}/>
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 48,
          padding: '0 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Hide sidebar (Ctrl+B)' : 'Show sidebar (Ctrl+B)'}
            style={{
              width: 26, height: 26,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid transparent', borderRadius: 4,
              background: 'transparent', color: sidebarOpen ? 'var(--text-2)' : 'var(--navy)',
              cursor: 'pointer', flexShrink: 0, marginLeft: -4,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          ><Ic.panel/></button>
          {view === 'sitesettings' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 3, background: 'var(--navy)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11 }}>⚙</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>Site settings · {site?.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>
                  name · environment · database · password
                </div>
              </div>
            </div>
          ) : view === 'site' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 3, background: 'var(--navy)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="0" y="0" width="4" height="4"/><rect x="6" y="0" width="4" height="4"/><rect x="0" y="6" width="4" height="4"/><rect x="6" y="6" width="4" height="4"/></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>All projects</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>
                  {site?.name} · {projects.length} projects · site-wide overview
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              {(() => {
                /* Active-run dot — 사이드바와 동일 정책. 활성 run 이 있을 때만 켜지고
                   mode 에 따라 cutover=빨강 / rehearsal=주황. */
                const ar = window.getActiveRun?.(project.id);
                if (!ar) return <span style={{ width: 8, height: 8, flexShrink: 0 }}/>;
                const c = ar.mode === 'cutover' ? '#F87171' : '#FB923C';
                return (
                  <span title={`${ar.mode} run 진행 중 · ${ar.id}`} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: c, boxShadow: `0 0 0 2px ${c}33`,
                    flexShrink: 0,
                  }}/>
                );
              })()}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                  fontSize: 13, fontWeight: 600, letterSpacing: -0.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 320, display: 'inline-block',
                }}>{project.name.split('/').slice(-1)[0].trim()}</span>
                  {project.phase && (() => {
                    const ph = project.phase;
                    const bg = window.getPhaseBg?.(ph)    || 'var(--panel-2)';
                    const fg = window.getPhaseColor?.(ph) || 'var(--text-3)';
                    return (
                      <span title={window.getPhaseDesc?.(ph) || ''} style={{
                        padding: '1px 7px', fontSize: 10, fontWeight: 700,
                        fontFamily: 'var(--mono)', borderRadius: 3,
                        background: bg, color: fg, border: `1px solid ${fg}`,
                        textTransform: 'uppercase', letterSpacing: 0.4,
                        whiteSpace: 'nowrap',
                      }}>{window.getPhaseLabel?.(ph) || ph}</span>
                    );
                  })()}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                  <span>{project.src}</span>
                  <span style={{ color: 'var(--text-4)' }}><Ic.arrow/></span>
                  <span>{project.tgt}</span>
                  <span style={{ color: 'var(--text-4)' }}>·</span>
                  <span>{project.tables} tables</span>
                  {(() => {
                    const run = window.getActiveRun?.(project.id);
                    return run ? <><span style={{ color: 'var(--text-4)' }}>·</span><span>{run.id}</span></> : null;
                  })()}
                </div>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }}/>

          <NotificationBell
            notifications={notifications}
            onMarkRead={(id) => setNotifications(list => list.map(n => n.id === id ? { ...n, read: true } : n))}
            onMarkAllRead={() => setNotifications(list => list.map(n => ({ ...n, read: true })))}
            onClear={() => setNotifications([])}
            onItemClick={(n) => {
              if (n.projectId) setActiveProject(n.projectId);
              if (n.link?.section) setSettingsSection(n.link.section);
              if (n.link?.tab) setTab(n.link.tab);
              if (view !== 'project') setView('project');
            }}
          />
          {view === 'project' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
            {['asis', 'tobe'].map(side => {
              const c = project.connections?.[side];
              const dotColor = !c || c.status === 'untested' ? 'var(--text-4)'
                : c.status === 'ok' ? 'var(--green)'
                : c.status === 'failed' ? 'var(--red)'
                : c.status === 'testing' ? 'var(--amber)'
                : c.status === 'stale' ? 'var(--amber)'
                : 'var(--text-4)';
              const tooltip = !c ? '' :
                c.status === 'ok' ? `Connected · latency ${c.latencyMs}ms · last tested ${c.lastTestedAt}` :
                c.status === 'failed' ? `Failed · ${c.error} · ${c.lastTestedAt}` :
                c.status === 'testing' ? 'Testing connection…' :
                c.status === 'stale' ? `Stale · last tested ${c.lastTestedAt}` :
                'Not tested yet';
              return (
                <button key={side} onClick={() => {
                    setSettingsSection(side === 'asis' ? 'source' : 'target');
                    setTab('settings');
                  }}
                  title={tooltip}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '2px 8px', background: 'var(--panel-2)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--panel)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--panel-2)'}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0 }}/>
                  {side === 'asis' ? 'AS-IS' : 'TO-BE'}
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Tabs */}
        {view === 'sitesettings' ? (
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '0 12px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--panel)',
            height: 30, gap: 10,
            fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)',
          }}>
            <button onClick={() => setView('project')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 3,
              background: 'var(--panel)', cursor: 'pointer', fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--sans)',
            }}>← Back</button>
            <span style={{ color: 'var(--text-4)' }}>/</span>
            <span>{site?.name.toLowerCase().replace(/\s+/g,'-')}</span>
            <span style={{ color: 'var(--text-4)' }}>/</span>
            <span style={{ color: 'var(--navy)', fontWeight: 600 }}>site settings</span>
          </div>
        ) : (
        <div style={{
          display: 'flex', alignItems: 'stretch',
          padding: '0 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          gap: 0, height: 30,
        }}>
          {(view === 'site' ? [
            { k: 'overview', l: 'Site overview', c: `${projects.length}` },
            { k: 'export',   l: 'Site export',   c: 'all' },
          ] : tabs).map(t => {
            const active = tab === t.k;
            const disabled = project.isNew && (t.k === 'artifacts');
            return (
              <button key={t.k} onClick={() => !disabled && setTab(t.k)}
                disabled={disabled}
                title={disabled ? 'No artifacts until a run completes' : undefined}
                style={{
                  position: 'relative',
                  padding: '0 13px', border: 'none', background: 'transparent',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  color: disabled ? 'var(--text-4)' : (active ? 'var(--navy)' : 'var(--text-2)'),
                  fontWeight: active ? 600 : 500, fontSize: 12,
                  opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', flexShrink: 0,
                }}
                onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                {t.l}
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)',
                  padding: '0 5px', background: active ? 'var(--navy-50)' : 'var(--panel-2)',
                  border: '1px solid var(--border)', borderRadius: 6,
                }}>{t.c}</span>
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: -1,
                    height: 2, background: 'var(--navy)',
                  }}/>
                )}
              </button>
            );
          })}
          <div style={{ flex: 1 }}/>
        </div>
        )}

        {/* Tab body */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--bg)' }}>
          {view === 'sitesettings'
            ? <SiteSettings site={site}
                onBack={() => setView('project')}
                onSave={(patch) => setSites(list => list.map(s => s.id === site.id ? { ...s, ...patch } : s))}
                onDelete={() => {
                  const remaining = sites.filter(s => s.id !== site.id);
                  setSites(remaining);
                  if (remaining[0]) setActiveSite(remaining[0].id);
                  setView('project');
                }}/>
            : view === 'site'
            ? (tab === 'export'
                ? <ExportTab project={null} tables={projectTables} mapping={MAPPING} scope="site" allProjects={projects}/>
                : <Site projects={projects}
                    onOpenProject={(id, goTab) => { setActiveProject(id); setView('project'); if (goTab) setTab(goTab); else setTab('dashboard'); }}
                    onExportSite={() => alert('Generating site-wide bundle (zip)…')}
                    onOpenExportTab={() => setTab('export')}/>)
            : project.isNew && tab !== 'settings'
            ? <EmptyProject project={project} tab={tab}/>
            : <>
                {tab === 'dashboard' && <Dashboard project={project} onTabChange={setTab}/>}
                {tab === 'mapping'   && <Mapping project={project} fixTarget={fixTarget} onConsumeFixTarget={() => setFixTarget(null)}/>}
                {tab === 'versions'  && <Versions project={project}/>}
                {tab === 'execution' && <Execution stages={STAGES} project={project}
                    onTabChange={setTab}
                    onSettingsSection={setSettingsSection}
                    onSetFixTarget={setFixTarget}/>}
                {tab === 'artifacts' && <Artifacts tables={projectSchema} projectTables={projectTables}/>}
                {tab === 'logs'      && <Logs lines={projectLogLines}/>}
                {tab === 'settings'  && <ProjectSettings project={project}
                    section={settingsSection}
                    onSectionChange={setSettingsSection}
                    notifEnabled={notifEnabled}
                    onRename={(nn) => setProjects(list => list.map(x => x.id === project.id ? { ...x, name: nn } : x))}
                    onDuplicate={() => {
                      const copy = { ...project, id: 'p' + Date.now(), name: project.name + ' (copy)', status: 'waiting', isNew: true };
                      setProjects(list => [copy, ...list]); setActiveProject(copy.id);
                    }}
                    onDelete={() => {
                      const remaining = projects.filter(x => x.id !== project.id);
                      setProjects(remaining);
                      if (remaining[0]) setActiveProject(remaining[0].id);
                      setTab('dashboard');
                    }}
                    onDdlChange={(side, meta) => setProjects(list => list.map(x => x.id === project.id ? { ...x, ddl: { ...(x.ddl || { asis: null, tobe: null }), [side]: meta } } : x))}
                    onTestConnection={(side) => {
                      /* 1) mark side as 'testing' */
                      setProjects(list => list.map(x => x.id === project.id ? {
                        ...x, connections: { ...x.connections, [side]: { ...x.connections[side], status: 'testing' } }
                      } : x));
                      /* 2) simulate network delay, then set final status — host-based mock: fail if host empty or contains 'bad'/'invalid' */
                      setTimeout(() => {
                        setProjects(list => list.map(x => {
                          if (x.id !== project.id) return x;
                          const host = side === 'asis' ? (x.config?.srcHost || 'mvs-prod.kdb.internal') : (x.config?.tgtHost || 'pg-core-01.kdb.internal');
                          const fail = !host.trim() || /bad|invalid|fail/i.test(host);
                          const prev = x.connections[side] || {};
                          const next = fail ? {
                            ...prev, status: 'failed', lastTestedAt: 'just now',
                            latencyMs: null,
                            error: !host.trim() ? 'Host is empty (mock)' : 'Connection refused — host unreachable (mock)',
                          } : {
                            ...prev, status: 'ok', lastTestedAt: 'just now',
                            latencyMs: 15 + Math.floor(Math.random() * 70),
                            detectedTables: prev.detectedTables || Math.floor(20 + Math.random() * 120),
                            error: null,
                          };
                          return { ...x, connections: { ...x.connections, [side]: next } };
                        }));
                      }, 1400);
                    }}
                    onCredentialsChange={(side, creds) => setProjects(list => list.map(x => x.id === project.id ? {
                      ...x, connections: { ...x.connections, [side]: { ...x.connections[side], credentials: creds } }
                    } : x))}
                    onSimulateFail={(side) => setProjects(list => list.map(x => x.id === project.id ? {
                      ...x, connections: { ...x.connections, [side]: {
                        ...x.connections?.[side], status: 'failed',
                        lastTestedAt: 'just now', latencyMs: null,
                        error: 'Connection refused — host unreachable (mock)',
                      } }
                    } : x))}/>}
              </>
          }
        </div>

      </main>

      {showNew && <NewProjectModal
        onClose={() => setShowNew(false)}
        onCreate={(p) => {
          setProjects(list => [p, ...list]);
          setActiveProject(p.id);
          setShowNew(false);
          setTab('dashboard');
        }}
      />}

      {overlay === 'profile'  && <AccountProfile onClose={() => setOverlay(null)}/>}
      {overlay === 'help'     && <Help onClose={() => setOverlay(null)}/>}
      {overlay === 'about'    && <About onClose={() => setOverlay(null)}/>}
      {overlay === 'solutionsettings' && <SolutionSettings onClose={() => setOverlay(null)} theme={theme} setTheme={setTheme}
        notifEnabled={notifEnabled} setNotifEnabled={setNotifEnabled}/>}
      {overlay === 'signout'  && <SignOutScreen
        onCancel={() => setOverlay(null)}
        onConfirm={() => setOverlay('signedout')}
      />}
      {overlay === 'signedout' && <SignedOutScreen onSignIn={() => setOverlay(null)}/>}

      {showNewSite && <NewSiteModal
        onClose={() => setShowNewSite(false)}
        onCreate={(ns) => {
          setSites(list => [...list, ns]);
          setActiveSite(ns.id);
          setShowNewSite(false);
        }}
      />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
