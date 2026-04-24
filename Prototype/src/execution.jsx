/* Execution & monitoring tab — run controls, progress, pre-flight checks, quarantine viewer */

const Execution = ({ stages, project, onTabChange, onSettingsSection }) => {
  const [tick, setTick] = React.useState(0);
  const [running, setRunning] = React.useState(true);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick(t => t + 1), 1200);
    return () => clearInterval(id);
  }, [running]);

  const s = stages.map(st => ({
    ...st,
    pct: st.tone === 'running' ? Math.min(st.pct + ((tick * 0.4) % 3.5), 99) : st.pct,
  }));
  const overall = s.reduce((a, x) => a + x.pct, 0) / s.length;

  /* Pre-flight checks — computed on every render from current project state. */
  const checks = React.useMemo(
    () => (window.getPreflightChecks ? window.getPreflightChecks(project) : []),
    [project, tick]
  );
  const counts = checks.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {});
  const hasBlocking = (counts.fail || 0) > 0;

  const navigateToFix = (fix) => {
    if (!fix || !onTabChange) return;
    if (fix.section && onSettingsSection) onSettingsSection(fix.section);
    onTabChange(fix.tab);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Run header */}
      <RunHeader project={project} running={running} onToggleRun={() => setRunning(r => !r)}/>

      {/* Pre-flight checks */}
      <PreflightPanel checks={checks} counts={counts} hasBlocking={hasBlocking} onFix={navigateToFix}/>

      {/* Overall progress */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
        <div style={{ flex: 1, padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Overall progress</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{overall.toFixed(1)}% · 2 of 7 stages complete</div>
          </div>
          <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 2, overflow: 'hidden' }}>
            {s.map(st => (
              <div key={st.id} title={`${st.name} · ${st.pct.toFixed(0)}%`}
                style={{ flex: 1, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  width: `${st.pct}%`, height: '100%',
                  background: st.tone === 'ok' ? 'var(--green)' : st.tone === 'idle' ? 'var(--text-4)' : st.color,
                  transition: 'width .4s ease',
                }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
            {s.map(st => (
              <div key={st.id} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                {st.name.toLowerCase().split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage list */}
      <div style={{ padding: '14px 18px', background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Pipeline stages</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--panel)' }}>
          {s.map((st, i) => (
            <div key={st.id} style={{
              display: 'grid',
              gridTemplateColumns: '24px 170px 1fr 80px 90px 80px 24px',
              gap: 14, alignItems: 'center',
              padding: '10px 14px',
              borderBottom: i < s.length - 1 ? '1px solid var(--border)' : 'none',
              background: st.tone === 'running' ? 'var(--amber-50)' : 'var(--panel)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{st.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{st.sub}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar pct={st.pct} tone={st.tone} color={st.tone !== 'idle' && st.tone !== 'ok' ? st.color : undefined}/>
                </div>
                <div style={{ width: 44, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{st.pct.toFixed(0)}%</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{st.rate}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-3)' }}>eta {st.eta}</div>
              <div>
                {st.tone === 'ok' && <StatusBadge tone="ok">done</StatusBadge>}
                {st.tone === 'running' && <StatusBadge tone="running">live</StatusBadge>}
                {st.tone === 'idle' && <StatusBadge tone="queued">queued</StatusBadge>}
              </div>
              <div style={{ color: 'var(--text-4)', cursor: 'pointer' }}><Ic.chevR/></div>
            </div>
          ))}
        </div>
      </div>

      {/* Run history */}
      <RunHistory project={project}/>

      {/* Quarantine + workers */}
      <div style={{ display: 'flex', gap: 14, padding: 14, background: 'var(--bg)', flex: 1, minHeight: 260 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <QuarantineViewer entries={window.QUARANTINE_ENTRIES || []}/>
        </div>

        {/* Workers */}
        <div style={{ width: 320, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 4, padding: 12, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Worker pool</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>12 / 16 active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, marginBottom: 12 }}>
            {Array.from({ length: 16 }).map((_, i) => {
              const state = i < 2 ? 'idle' : i < 12 ? 'running' : i < 14 ? 'ok' : 'idle';
              const c = state === 'running' ? 'var(--amber)' : state === 'ok' ? 'var(--green)' : 'var(--border-strong)';
              return (
                <div key={i} style={{
                  height: 22, borderRadius: 2, background: c,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--mono)', fontSize: 9, color: state === 'idle' ? 'var(--text-3)' : '#fff',
                  fontWeight: 500,
                }}>{String(i + 1).padStart(2, '0')}</div>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--text-2)', lineHeight: 1.7 }}>
            <Kv k="queue depth" v="3"/>
            <Kv k="buffer" v="64 MB"/>
            <Kv k="lag" v="212 ms" tone="ok"/>
            <Kv k="retries" v="7"/>
            <Kv k="mem" v="4.2 / 8.0 GB"/>
            <Kv k="cpu" v="68%"/>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Pre-flight panel ────────────────────────────────────────────
   Collapsible strip below the run header. Summarizes gate checks; expands
   to show each check with its status, detail and a Fix-link that deep-jumps
   to the relevant tab/section. */

const PreflightPanel = ({ checks, counts, hasBlocking, onFix }) => {
  /* Default open if any fail or >=2 warn; otherwise compact. */
  const shouldOpen = hasBlocking || (counts.warn || 0) >= 2;
  const [open, setOpen] = React.useState(shouldOpen);
  React.useEffect(() => { setOpen(shouldOpen); /* re-sync on data change */ }, [shouldOpen]);

  const toneFor = (s) => s === 'pass' ? 'ok' : s === 'warn' ? 'warn' : s === 'fail' ? 'err' : 'queued';

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: hasBlocking ? 'var(--red-50)' : (counts.warn ? 'var(--amber-50)' : 'var(--panel)') }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: '9px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}>
        <span style={{ color: 'var(--text-4)', fontSize: 10, width: 10 }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: hasBlocking ? 'var(--red)' : (counts.warn ? 'var(--amber)' : 'var(--text-2)') }}>
          Pre-flight
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {counts.pass > 0 && <StatusBadge tone="ok">{counts.pass} pass</StatusBadge>}
          {counts.warn > 0 && <StatusBadge tone="warn">{counts.warn} warn</StatusBadge>}
          {counts.fail > 0 && <StatusBadge tone="err">{counts.fail} fail</StatusBadge>}
          {counts.skip > 0 && <StatusBadge tone="queued">{counts.skip} n/a</StatusBadge>}
        </div>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          {hasBlocking ? 'Run blocked — fix 위 항목을 해결하세요'
            : counts.warn ? 'Run 가능 · 주의 항목 확인 권장'
            : 'All checks pass — ready to run'}
        </span>
      </div>

      {open && (
        <div style={{ padding: '4px 18px 14px' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel)' }}>
            {checks.map((c, i) => (
              <div key={c.id} style={{
                display: 'grid', gridTemplateColumns: '24px 260px 1fr auto',
                alignItems: 'center', gap: 12,
                padding: '8px 14px',
                borderBottom: i < checks.length - 1 ? '1px solid var(--border)' : 'none',
                background: c.status === 'fail' ? 'var(--red-50)' : c.status === 'warn' ? 'var(--amber-50)' : 'var(--panel)',
              }}>
                <StatusDot tone={toneFor(c.status)} size={9}/>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{c.title}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: c.status === 'fail' ? 'var(--red)' : c.status === 'warn' ? 'var(--amber)' : c.status === 'skip' ? 'var(--text-4)' : 'var(--text-2)' }}>
                  {c.detail}
                </span>
                {c.fix && c.status !== 'pass' && c.status !== 'skip' && (
                  <Btn kind="ghost" size="sm" onClick={() => onFix?.(c.fix)}>
                    Fix →
                  </Btn>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Quarantine viewer ──────────────────────────────────────────
   Replaces the prior single-error / single-warning callouts. Groups
   quarantined rows by reason, lets user drill in to inspect sample rows
   and take action (requeue / discard / export — placeholder alerts for
   the prototype). */

const QuarantineViewer = ({ entries }) => {
  const [filter, setFilter] = React.useState('all'); // all | error | warning
  const [expanded, setExpanded] = React.useState(new Set([entries[0]?.id]));

  const filtered = entries.filter(e => filter === 'all' || e.severity === filter);
  const total = entries.reduce((a, e) => a + e.count, 0);
  const errs = entries.filter(e => e.severity === 'error');
  const warns = entries.filter(e => e.severity === 'warning');
  const errRows = errs.reduce((a, e) => a + e.count, 0);
  const warnRows = warns.reduce((a, e) => a + e.count, 0);

  const toggle = (id) => {
    const n = new Set(expanded);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpanded(n);
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7 }}>Quarantine</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>
            {entries.length} groups · {total} rows ({errRows} error · {warnRows} warning)
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', height: 24, border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden', background: 'var(--panel)' }}>
          {[
            { k: 'all', l: 'All', n: entries.length },
            { k: 'error', l: 'Errors', n: errs.length },
            { k: 'warning', l: 'Warnings', n: warns.length },
          ].map((f, i) => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '0 10px', border: 'none',
              borderLeft: i ? '1px solid var(--border)' : 'none',
              background: filter === f.k ? 'var(--navy-50)' : 'transparent',
              color: filter === f.k ? 'var(--navy)' : 'var(--text-2)',
              fontWeight: filter === f.k ? 600 : 500, fontSize: 11.5,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>{f.l} <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{f.n}</span></button>
          ))}
        </div>
        <Btn kind="ghost" size="sm" icon={<Ic.download/>}>Export all</Btn>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
            격리된 행이 없습니다.
          </div>
        )}
        {filtered.map((e, i) => {
          const isOpen = expanded.has(e.id);
          const tone = e.severity === 'error' ? 'err' : 'warn';
          const bdColor = e.severity === 'error' ? 'var(--red)' : 'var(--amber)';
          return (
            <div key={e.id} style={{
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              borderLeft: `3px solid ${bdColor}`,
            }}>
              <div onClick={() => toggle(e.id)} style={{
                display: 'grid', gridTemplateColumns: '16px 1fr auto auto auto',
                alignItems: 'center', gap: 10,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--panel-2)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: 'var(--text-4)', fontSize: 10 }}>{isOpen ? '▾' : '▸'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: e.severity === 'error' ? 'var(--red)' : 'var(--amber)' }}>
                    {e.reason}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.detail}
                  </div>
                </div>
                <StatusBadge tone={tone}>{e.count} {e.count === 1 ? 'row' : 'rows'}</StatusBadge>
                <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{e.stage}</span>
                <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-4)' }}>{e.firstSeenAt}</span>
              </div>

              {isOpen && (
                <div style={{ padding: '4px 12px 12px 34px', background: 'var(--panel-2)' }}>
                  {/* Sample rows */}
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                    Sample rows ({Math.min(e.sampleRows.length, 4)} of {e.count})
                  </div>
                  <div style={{
                    border: '1px solid var(--border)', borderRadius: 3, background: 'var(--panel)',
                    fontFamily: 'var(--mono)', fontSize: 11,
                    overflow: 'auto',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {Object.keys(e.sampleRows[0] || {}).map(k => (
                            <th key={k} style={{
                              padding: '3px 8px', textAlign: 'left',
                              fontWeight: 500, fontSize: 10, color: 'var(--text-3)',
                              textTransform: 'uppercase', letterSpacing: 0.5,
                              background: 'var(--panel-2)', borderBottom: '1px solid var(--border)',
                              whiteSpace: 'nowrap',
                            }}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {e.sampleRows.slice(0, 4).map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: ri < 3 ? '1px solid var(--border)' : 'none' }}>
                            {Object.entries(row).map(([k, v]) => (
                              <td key={k} style={{
                                padding: '2px 8px',
                                color: 'var(--text-2)',
                                whiteSpace: 'nowrap',
                              }}>{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <Btn kind="primary" size="sm" onClick={() => alert(`v1: ${e.count} rows을 파이프라인에 다시 넣습니다.`)}>Requeue {e.count} rows</Btn>
                    <Btn kind="secondary" size="sm" onClick={() => alert(`v1: ${e.count} rows을 영구 제거합니다. 감사 로그에 기록.`)}>Discard</Btn>
                    <Btn kind="secondary" size="sm" icon={<Ic.download/>} onClick={() => alert(`v1: ${e.table}_quarantine_${e.id}.csv 다운로드.`)}>Export CSV</Btn>
                    <div style={{ flex: 1 }}/>
                    <Btn kind="ghost" size="sm" onClick={() => alert('v1: 해당 테이블의 행 인스펙터를 엽니다 (full row data).')}>Open row inspector</Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Run header ─────────────────────────────────────────────────
   Shows the active run (if any) plus mode badge (rehearsal/cutover),
   triggeredBy (control-m / manual / jenkins etc.) and CLI hint toggle. */

const RunHeader = ({ project, running, onToggleRun }) => {
  const run = window.getActiveRun ? window.getActiveRun(project?.id) : null;
  const history = window.getRuns ? window.getRuns(project?.id) : [];
  const [cliOpen, setCliOpen] = React.useState(false);

  if (!run) {
    const lastRun = history[0];
    return (
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>No active run</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
            {lastRun ? <>last run: <b>{lastRun.id}</b> · {lastRun.startedAt} · {lastRun.result}</>
              : <>run 이력 없음 — 분석/설계 단계입니다</>}
          </div>
        </div>
        <Btn kind="secondary" size="sm" icon={<Ic.ext/>} onClick={() => setCliOpen(o => !o)}>CLI</Btn>
        {cliOpen && <CliHintOverlay projectId={project?.id} onClose={() => setCliOpen(false)}/>}
      </div>
    );
  }

  const modeRed = run.mode === 'cutover';
  const modeBg = modeRed ? 'var(--red-50)' : 'var(--navy-50)';
  const modeFg = modeRed ? 'var(--red)' : 'var(--navy)';
  const modeBd = modeRed ? 'var(--red)' : 'var(--navy)';

  return (
    <div style={{
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--panel)',
      display: 'flex', alignItems: 'center', gap: 16,
      position: 'relative',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Active run</span>
          <span style={{
            padding: '1px 7px', fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--mono)',
            borderRadius: 3, background: modeBg, color: modeFg, border: `1px solid ${modeBd}`,
            letterSpacing: 0.4,
          }}>{run.mode === 'cutover' ? '⚠ CUTOVER' : 'REHEARSAL'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600 }}>{run.id}</span>
          <StatusBadge tone={running ? 'running' : 'warn'}>{running ? 'running' : 'paused'}</StatusBadge>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            started {run.startedAt.split(' ')[1] || run.startedAt} · elapsed {run.elapsed}{run.eta ? ` · eta ${run.eta}` : ''}
          </span>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 3 }}>
          triggered by <b style={{ color: 'var(--text-2)' }}>{run.triggeredBy?.actor}</b>
          {run.triggeredBy?.source && <span> · {run.triggeredBy.source}</span>}
        </div>
      </div>
      <Btn kind="ghost" size="sm" icon={<Ic.ext/>} onClick={() => setCliOpen(o => !o)}>CLI</Btn>
      <Btn kind="secondary" size="md" icon={running ? <Ic.pause/> : <Ic.play/>} onClick={onToggleRun}>{running ? 'Pause' : 'Resume'}</Btn>
      <Btn kind="danger" size="md" icon={<Ic.stop/>}>Abort</Btn>
      {cliOpen && <CliHintOverlay projectId={project?.id} onClose={() => setCliOpen(false)}/>}
    </div>
  );
};

/* Small overlay anchored under the CLI button — shows the external command
   that a scheduler (Control-M / Jenkins / cron) would invoke. */
const CliHintOverlay = ({ projectId, onClose }) => {
  const ref = React.useRef();
  React.useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => window.addEventListener('mousedown', close), 0);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, []);
  const pid = projectId || 'p1';
  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{
      position: 'absolute', right: 18, top: 68,
      width: 520,
      background: 'var(--panel)',
      border: '1px solid var(--border-strong)', borderRadius: 6,
      boxShadow: '0 12px 32px rgba(20,30,50,.18)',
      zIndex: 100, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>External trigger · CLI</div>
        <div style={{ flex: 1 }}/>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', padding: 2 }}><Ic.x/></button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.5 }}>
        이 툴은 자체 스케줄러가 없습니다. 외부 스케줄러(Control-M / Jenkins / Airflow / cron)에 아래 명령을 등록하세요.
      </div>
      <div style={{
        padding: 10, background: '#0e1a2b', color: '#cad7e8',
        fontFamily: 'var(--mono)', fontSize: 11.5, borderRadius: 3, lineHeight: 1.7,
      }}>
        <div><span style={{ color: '#7a8aa6' }}># 매일 밤 rehearsal (test target)</span></div>
        <div><span style={{ color: '#e8b86f' }}>migrate</span> run --project <span style={{ color: '#9fd9b3' }}>{pid}</span> --mode <span style={{ color: '#9fd9b3' }}>rehearsal</span> --dry-run</div>
        <div style={{ marginTop: 6 }}><span style={{ color: '#7a8aa6' }}># 컷오버 (prod target · 승인된 스냅샷 필요)</span></div>
        <div><span style={{ color: '#e8b86f' }}>migrate</span> run --project <span style={{ color: '#9fd9b3' }}>{pid}</span> --mode <span style={{ color: '#9fd9b3' }}>cutover</span></div>
        <div style={{ marginTop: 6 }}><span style={{ color: '#7a8aa6' }}># rollback (cutover 실패 시)</span></div>
        <div><span style={{ color: '#e8b86f' }}>migrate</span> rollback --project <span style={{ color: '#9fd9b3' }}>{pid}</span> --to <span style={{ color: '#9fd9b3' }}>pre-cutover</span></div>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 8, fontFamily: 'var(--mono)' }}>
        CLI 경로 · API endpoint는 Solution Settings › External integrations에서 설정
      </div>
    </div>
  );
};

/* ─── Run history section ────────────────────────────────────────
   Collapsible table of past runs — rehearsals + cutover(s). Shows mode,
   duration, result, quarantine trend, and who triggered. */

const RunHistory = ({ project }) => {
  const runs = window.getRuns ? window.getRuns(project?.id) : [];
  const [open, setOpen] = React.useState(false);
  if (runs.length <= 1) return null; // nothing interesting beyond the current one

  const rehearsals = runs.filter(r => r.mode === 'rehearsal');
  const cutovers   = runs.filter(r => r.mode === 'cutover');
  const converging = rehearsals.slice(0, 5).map(r => r.quarantineCount).filter(n => n != null);

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: '9px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}>
        <span style={{ color: 'var(--text-4)', fontSize: 10, width: 10 }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-2)' }}>Run history</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <StatusBadge tone="info">{rehearsals.length} rehearsal{rehearsals.length === 1 ? '' : 's'}</StatusBadge>
          {cutovers.length > 0 && <StatusBadge tone="err">{cutovers.length} cutover{cutovers.length === 1 ? '' : 's'}</StatusBadge>}
        </div>
        <div style={{ flex: 1 }}/>
        {converging.length >= 2 && (
          <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            quarantine trend: {converging.join(' → ')}
          </span>
        )}
      </div>

      {open && (
        <div style={{ padding: '4px 18px 12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr>
                {['Run ID', 'Mode', 'Started', 'Duration', 'Result', 'Quar.', 'Triggered by'].map(h => (
                  <th key={h} style={{
                    padding: '6px 10px', textAlign: 'left',
                    fontSize: 10.5, fontWeight: 500,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6,
                    background: 'var(--panel-2)', borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => {
                const isActive = r.result === 'running';
                const modeBd = r.mode === 'cutover' ? 'var(--red)' : 'var(--navy)';
                const resultTone = r.result === 'ok' ? 'ok' : r.result === 'warn' ? 'warn' : r.result === 'aborted' || r.result === 'failed' ? 'err' : 'running';
                return (
                  <tr key={r.id} style={{
                    background: isActive ? 'var(--navy-50)' : i % 2 ? 'var(--zebra)' : 'var(--panel)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontWeight: 500 }}>
                      {r.id}
                      {isActive && <span style={{ marginLeft: 6, color: 'var(--navy)', fontSize: 10 }}>· current</span>}
                    </td>
                    <td style={{ padding: '5px 10px' }}>
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--mono)',
                        padding: '1px 6px', borderRadius: 2,
                        background: r.mode === 'cutover' ? 'var(--red-50)' : 'var(--navy-50)',
                        color: modeBd, border: `1px solid ${modeBd}`,
                        letterSpacing: 0.4, textTransform: 'uppercase',
                      }}>{r.mode}</span>
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{r.startedAt}</td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{r.elapsed || '—'}</td>
                    <td style={{ padding: '5px 10px' }}>
                      <StatusBadge tone={resultTone}>{r.result}</StatusBadge>
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', textAlign: 'right', color: r.quarantineCount > 0 ? 'var(--amber)' : 'var(--text-3)' }}>
                      {r.quarantineCount ?? '—'}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      {r.triggeredBy?.actor}
                      {r.triggeredBy?.source && <span style={{ color: 'var(--text-4)' }}> · {r.triggeredBy.source}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Kv = ({ k, v, tone }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px dashed var(--border)' }}>
    <span style={{ color: 'var(--text-3)' }}>{k}</span>
    <span style={{ color: tone === 'ok' ? 'var(--green)' : 'var(--text)' }}>{v}</span>
  </div>
);

window.Execution = Execution;
