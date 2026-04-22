/* App shell — topbar, tabs, routing between tabs */

const DEFAULT_SITES = [
  { id: 's1', name: 'KDB Bank',    env: 'Mainframe',     envDetail: 'z/OS 2.5 · EBCDIC',     dbKind: 'PostgreSQL', dbVer: '15.4' },
  { id: 's2', name: 'NH Insurance', env: 'AS/400 · IBM i', envDetail: 'IBM i 7.4 · EBCDIC-KO', dbKind: 'Tibero',     dbVer: '7.1' },
  { id: 's3', name: 'KT Telecom',   env: 'Unix · Oracle',  envDetail: 'Solaris 11 · AL32UTF8', dbKind: 'PostgreSQL', dbVer: '15.4' },
];

const App = () => {
  const [activeProject, setActiveProject] = React.useState('p1');
  const [view, setView] = React.useState('project'); // 'site' | 'project' | 'sitesettings' | 'solutionsettings'
  const [tab, setTab] = React.useState('dashboard');
  const [sites, setSites] = React.useState(DEFAULT_SITES);
  const [activeSite, setActiveSite] = React.useState('s1');

  React.useEffect(() => {
    if (view === 'site' && tab !== 'overview' && tab !== 'export') setTab('overview');
    if (view === 'project' && (tab === 'overview')) setTab('dashboard');
  }, [view]);
  const [theme, setTheme] = React.useState(window.APP_PREFS?.theme || 'light');
  const [projects, setProjects] = React.useState(PROJECTS);
  const [showNew, setShowNew] = React.useState(false);
  const [showNewSite, setShowNewSite] = React.useState(false);
  const [overlay, setOverlay] = React.useState(null); // 'profile' | 'help' | 'about' | 'signout' | 'signedout' | null

  const project = projects.find(p => p.id === activeProject) || projects[0];
  const site = sites.find(s => s.id === activeSite) || sites[0];

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const tabs = [
    { k: 'dashboard', l: 'Dashboard', c: `${TABLES.length} tables` },
    { k: 'mapping',   l: 'Mapping', c: `${MAPPING.length} fields` },
    { k: 'execution', l: 'Execution', c: 'live' },
    { k: 'artifacts', l: 'Artifacts', c: `${SCHEMA_DIFF.length * 5 + 1}` },
    { k: 'logs',      l: 'Log viewer', c: `${LOG_LINES.length}` },
    { k: 'settings',  l: 'Settings', c: '⚙' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar projects={projects} activeId={view === 'site' ? null : activeProject}
        siteActive={view === 'site'}
        sites={sites} activeSite={activeSite}
        onSwitchSite={(id) => setActiveSite(id)}
        onNewSite={() => setShowNewSite(true)}
        onSiteSettings={() => setView('sitesettings')}
        onSolutionSettings={() => setView('solutionsettings')}
        solutionActive={view === 'solutionsettings'}
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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 48,
          padding: '0 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
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
          ) : view === 'solutionsettings' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 3, background: 'var(--navy)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11 }}>⚙</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>Solution settings</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>
                  preferences for migrate.console · applies across all sites
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
              <StatusDot tone={project.status} size={8}/>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                  fontSize: 13, fontWeight: 600, letterSpacing: -0.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 320, display: 'inline-block',
                }}>{project.name.split('/').slice(-1)[0].trim()}</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                  <span>{project.src}</span>
                  <span style={{ color: 'var(--text-4)' }}><Ic.arrow/></span>
                  <span>{project.tgt}</span>
                  <span style={{ color: 'var(--text-4)' }}>·</span>
                  <span>{project.tables} tables</span>
                  <span style={{ color: 'var(--text-4)' }}>·</span>
                  <span>run-2026-0421-0914</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '2px 8px', background: 'var(--panel-2)',
              border: '1px solid var(--border)', borderRadius: 10,
            }} title="AS-IS source database connection">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }}/>
              AS-IS
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '2px 8px', background: 'var(--panel-2)',
              border: '1px solid var(--border)', borderRadius: 10,
            }} title="TO-BE target database connection">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }}/>
              TO-BE
            </span>
          </div>
        </div>

        {/* Tabs */}
        {view === 'sitesettings' || view === 'solutionsettings' ? (
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
            <span>{view === 'sitesettings' ? (site?.name.toLowerCase().replace(/\s+/g,'-')) : 'migrate.console'}</span>
            <span style={{ color: 'var(--text-4)' }}>/</span>
            <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{view === 'sitesettings' ? 'site settings' : 'solution settings'}</span>
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
            : view === 'solutionsettings'
            ? <SolutionSettings onBack={() => setView('project')} theme={theme} setTheme={setTheme}/>
            : view === 'site'
            ? (tab === 'export'
                ? <ExportTab project={null} tables={TABLES} mapping={MAPPING} scope="site" allProjects={projects}/>
                : <Site projects={projects}
                    onOpenProject={(id, goTab) => { setActiveProject(id); setView('project'); if (goTab) setTab(goTab); else setTab('dashboard'); }}
                    onExportSite={() => alert('Generating site-wide bundle (zip)…')}
                    onOpenExportTab={() => setTab('export')}/>)
            : project.isNew
            ? <EmptyProject project={project} tab={tab}/>
            : <>
                {tab === 'dashboard' && <Dashboard tables={TABLES}/>}
                {tab === 'mapping'   && <Mapping mapping={MAPPING}/>}
                {tab === 'execution' && <Execution stages={STAGES}/>}
                {tab === 'artifacts' && <Artifacts tables={SCHEMA_DIFF} projectTables={TABLES}/>}
                {tab === 'logs'      && <Logs lines={LOG_LINES}/>}
                {tab === 'settings'  && <ProjectSettings project={project}
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
                    }}/>}
              </>
          }
        </div>

        {/* Footer status bar */}
        <div style={{
          height: 20, display: 'flex', alignItems: 'center',
          padding: '0 12px', borderTop: '1px solid var(--border)',
          background: '#0e7268', color: '#cfd9e6',
          fontSize: 10.5, fontFamily: 'var(--mono)', gap: 12,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }}/>
            run-2026-0421-0914
          </span>
          <span>stage: transform</span>
          <span>throughput 298 MB/s</span>
          <span>queue 3</span>
          <span>errors 2</span>
          <span>warnings 5</span>
          <div style={{ flex: 1 }}/>
          <span>site {site?.name.toLowerCase().replace(/\s+/g,'-')}</span>
          <span>v4.12.0</span>
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
