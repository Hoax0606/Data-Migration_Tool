/* Site-wide overview — "All projects" dashboard
   Shows:
   - Top KPI tiles: total projects, total tables, total rows, processed rows, errors, warnings
   - Per-project progress table with row bars (rows total vs processed)
   - Status mix ring + stage breakdown + recent errors
   - Export-site button (delegates to onExportSite) */

const Site = ({ projects, onOpenProject, onExportSite, onOpenExportTab }) => {
  /* Derive synthetic per-project stats that look plausible. Keyed by id so
     the numbers are stable across renders. */
  const stats = React.useMemo(() => {
    const rnd = (seed) => { let x = seed; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
    return projects.map((p, i) => {
      const r = rnd(i + 7);
      const base = p.tables * 180_000;
      const total = Math.round(base * (0.6 + r() * 1.8));
      let done;
      if (p.status === 'done') done = total;
      else if (p.status === 'waiting') done = Math.round(total * r() * 0.25);
      else done = Math.round(total * (0.5 + r() * 0.45));
      return {
        ...p,
        rowsTotal: total,
        rowsDone: done,
        pct: total ? (done / total) * 100 : 0,
        errors: p.status === 'running' ? Math.floor(r() * 4) : (p.status === 'waiting' ? 0 : Math.floor(r() * 2)),
        warnings: Math.floor(r() * 8),
        artifacts: p.tables * 5,
      };
    });
  }, [projects]);

  const totals = stats.reduce((a, s) => ({
    projects: a.projects + 1,
    tables: a.tables + s.tables,
    rowsTotal: a.rowsTotal + s.rowsTotal,
    rowsDone: a.rowsDone + s.rowsDone,
    errors: a.errors + s.errors,
    warnings: a.warnings + s.warnings,
    artifacts: a.artifacts + s.artifacts,
    running: a.running + (s.status === 'running' ? 1 : 0),
    waiting: a.waiting + (s.status === 'waiting' ? 1 : 0),
    done: a.done + (s.status === 'done' ? 1 : 0),
  }), { projects: 0, tables: 0, rowsTotal: 0, rowsDone: 0, errors: 0, warnings: 0, artifacts: 0, running: 0, waiting: 0, done: 0 });

  const pctTotal = totals.rowsTotal ? (totals.rowsDone / totals.rowsTotal) * 100 : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: 0,
      height: '100%',
      minHeight: 0,
    }}>
      {/* Left column: KPIs + table */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          display: 'flex', alignItems: 'flex-end', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--mono)', marginBottom: 3 }}>
              site overview · {window.TENANT || 'KDB Bank'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.2 }}>All projects</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>
              {totals.projects} projects · {totals.tables.toLocaleString()} tables · {totals.artifacts.toLocaleString()} artifact files
            </div>
          </div>
          <Btn kind="secondary" size="sm" icon={<Ic.refresh/>}>Refresh</Btn>
          <Btn kind="secondary" size="sm" icon={<Ic.download/>} onClick={onOpenExportTab}>Site export…</Btn>
          <Btn kind="primary" size="sm" icon={<Ic.download/>} onClick={onExportSite}>Download all</Btn>
        </div>

        {/* KPI tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 1,
          background: 'var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <Kpi label="Projects"  value={totals.projects} sub={`${totals.running} running · ${totals.waiting} waiting · ${totals.done} done`} tone="info"/>
          <Kpi label="Rows total"  value={abbr(totals.rowsTotal)} sub={`${totals.rowsTotal.toLocaleString()} rows`}/>
          <Kpi label="Rows processed"  value={abbr(totals.rowsDone)} sub={`${pctTotal.toFixed(1)}% of total`} tone="ok"/>
          <Kpi label="Errors"  value={totals.errors} sub="across all projects" tone={totals.errors ? 'err' : 'ok'}/>
          <Kpi label="Warnings"  value={totals.warnings} sub="non-blocking" tone="warn"/>
        </div>

        {/* Overall progress bar */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'nowrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Overall progress</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
              {abbr(totals.rowsDone)} / {abbr(totals.rowsTotal)} rows · {pctTotal.toFixed(2)}%
            </span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
              eta 04:12:07 · throughput 298 MB/s
            </span>
          </div>
          <StackedBar stats={stats}/>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            <LegendDot tone="ok"      label={`completed ${stats.filter(s => s.status === 'done').length}`}/>
            <LegendDot tone="running" label={`running ${totals.running}`}/>
            <LegendDot tone="waiting" label={`waiting ${totals.waiting}`}/>
          </div>
        </div>

        {/* Projects table */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{
                position: 'sticky', top: 0, zIndex: 1,
                background: 'var(--panel-2)', borderBottom: '1px solid var(--border)',
              }}>
                {['Project','Source → Target','Tables','Rows (done / total)','Progress','Errors','Warn','Updated','Actions']
                  .map((h, i) => (
                    <th key={h} style={{
                      textAlign: i >= 2 && i <= 6 ? 'right' : 'left',
                      padding: '7px 10px',
                      fontSize: 10, fontWeight: 600,
                      color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6,
                      fontFamily: 'var(--mono)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 ? 'var(--zebra)' : 'transparent',
                  cursor: 'pointer',
                }}
                  onClick={() => onOpenProject(s.id)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--navy-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 ? 'var(--zebra)' : 'transparent'}
                >
                  <td className="mig-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                      <StatusDot tone={s.status} size={7}/>
                      <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="mig-td" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>
                    <span>{shorten(s.src)}</span> <span style={{ color: 'var(--text-4)' }}>→</span> <span>{shorten(s.tgt)}</span>
                  </td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{s.tables}</td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    <span style={{ color: 'var(--text)' }}>{abbr(s.rowsDone)}</span>
                    <span style={{ color: 'var(--text-4)' }}> / </span>
                    <span style={{ color: 'var(--text-3)' }}>{abbr(s.rowsTotal)}</span>
                  </td>
                  <td className="mig-td" style={{ width: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar pct={s.pct} tone={s.status === 'done' ? 'ok' : s.status === 'waiting' ? 'idle' : 'running'} height={5}/>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-2)', width: 36, textAlign: 'right' }}>{s.pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: s.errors ? 'var(--red)' : 'var(--text-4)' }}>
                    {s.errors || '—'}
                  </td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: s.warnings ? 'var(--amber)' : 'var(--text-4)' }}>
                    {s.warnings || '—'}
                  </td>
                  <td className="mig-td" style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>{s.updated}</td>
                  <td className="mig-td">
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenProject(s.id); }}
                        style={miniBtn}>Open</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenProject(s.id, 'export'); }}
                        style={miniBtn}>Export</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right column: visual rollups */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
        <Panel title="Status mix">
          <Donut
            segments={[
              { label: 'Running',   value: totals.running, tone: 'running' },
              { label: 'Waiting',   value: totals.waiting, tone: 'waiting' },
              { label: 'Completed', value: totals.done,    tone: 'ok' },
            ]}
          />
        </Panel>

        <Panel title="Pipeline stages (aggregate)">
          <StageBars stats={stats}/>
        </Panel>

        <Panel title="Source / target mix">
          <MixList stats={stats} field="src"/>
          <div style={{ height: 8 }}/>
          <MixList stats={stats} field="tgt"/>
        </Panel>

        <Panel title="Recent issues" last>
          <IssueFeed/>
        </Panel>
      </div>
    </div>
  );
};

/* ============ sub components ============ */

const Kpi = ({ label, value, sub, tone }) => {
  const color = {
    ok:   'var(--green)',
    err:  'var(--red)',
    warn: 'var(--amber)',
    info: 'var(--navy)',
  }[tone];
  return (
    <div style={{
      background: 'var(--panel)',
      padding: '10px 14px 12px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'var(--mono)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, color: color || 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>{sub}</div>
    </div>
  );
};

const StackedBar = ({ stats }) => {
  const total = stats.reduce((a, s) => a + s.rowsTotal, 0) || 1;
  return (
    <div style={{
      display: 'flex',
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'var(--panel)',
    }}>
      {stats.map((s, i) => {
        const w = (s.rowsTotal / total) * 100;
        const done = (s.rowsDone / s.rowsTotal) * 100 || 0;
        const tone = s.status === 'done' ? 'var(--green)' : s.status === 'waiting' ? 'var(--text-4)' : 'var(--amber)';
        return (
          <div key={s.id} title={`${s.name} · ${s.pct.toFixed(1)}%`} style={{
            width: `${w}%`,
            borderRight: i < stats.length - 1 ? '1px solid var(--panel)' : 'none',
            background: `linear-gradient(to right, ${tone} ${done}%, var(--border) ${done}%)`,
          }}/>
        );
      })}
    </div>
  );
};

const LegendDot = ({ tone, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <StatusDot tone={tone} size={6}/>{label}
  </span>
);

const Panel = ({ title, children, last }) => (
  <div style={{
    padding: '10px 14px 12px',
    borderBottom: last ? 'none' : '1px solid var(--border)',
    background: 'var(--panel)',
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'var(--mono)', marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);

const Donut = ({ segments }) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 42, C = 2 * Math.PI * R;
  let offset = 0;
  const tones = {
    running: 'var(--amber)', waiting: 'var(--text-4)', ok: 'var(--green)',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="55" cy="55" r={R} fill="none" stroke="var(--border)" strokeWidth="14"/>
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const dash = `${len} ${C - len}`;
          const el = (
            <circle key={i} cx="55" cy="55" r={R} fill="none"
              stroke={tones[s.tone]} strokeWidth="14"
              strokeDasharray={dash} strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ flex: 1 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, fontSize: 11 }}>
            <span style={{ width: 9, height: 9, background: tones[s.tone], borderRadius: 2 }}/>
            <span style={{ flex: 1, color: 'var(--text-2)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: 500 }}>{s.value}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StageBars = ({ stats }) => {
  /* Pretend aggregate stage completion using the same weights STAGES uses */
  const base = [
    { label: 'Extract',   pct: 100 },
    { label: 'Encode',    pct: 98 },
    { label: 'Unpack',    pct: 82 },
    { label: 'Transform', pct: 61 },
    { label: 'Validate',  pct: 34 },
    { label: 'Load',      pct: 18 },
    { label: 'Verify',    pct: 7  },
  ];
  return (
    <div>
      {base.map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 11, width: 68, color: 'var(--text-2)' }}>{s.label}</span>
          <div style={{ flex: 1 }}><ProgressBar pct={s.pct} tone={s.pct === 100 ? 'ok' : 'running'} height={5}/></div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', width: 32, textAlign: 'right' }}>{s.pct}%</span>
        </div>
      ))}
    </div>
  );
};

const MixList = ({ stats, field }) => {
  const map = {};
  stats.forEach(s => { map[s[field]] = (map[s[field]] || 0) + 1; });
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(r => r[1]));
  return (
    <div>
      <div style={{ fontSize: 9.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'var(--mono)', marginBottom: 4 }}>
        {field === 'src' ? 'source systems' : 'target systems'}
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 11, flex: 1, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>{shorten(k)}</span>
          <div style={{
            width: 60, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: 'var(--navy)' }}/>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', width: 16, textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </div>
  );
};

const IssueFeed = () => {
  const items = [
    { tone: 'err',  proj: 'Core Ledger',       text: 'FK violation GL_ENTRY.acct_no (4 rows)',  when: '2m' },
    { tone: 'err',  proj: 'Deposit Accounts',  text: 'invalid EBCDIC byte 0x3F at offset 0x1A0..', when: '4m' },
    { tone: 'warn', proj: 'Core Ledger',       text: 'last_txn_ts null-coerced on 14 rows',     when: '6m' },
    { tone: 'warn', proj: 'Loan Origination',  text: 'soft-dedupe CUST_CONTACT (3 rows)',        when: '12m' },
    { tone: 'warn', proj: 'FX Treasury',       text: 'kanji codepoint outside JIS X 0208 (2)',   when: '18m' },
  ];
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 7, padding: '4px 0', borderTop: i ? '1px solid var(--border)' : 'none', fontSize: 11 }}>
          <StatusDot tone={it.tone} size={6}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.text}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{it.proj} · {it.when} ago</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const miniBtn = {
  padding: '2px 8px', fontSize: 11,
  border: '1px solid var(--border-strong)', background: 'var(--panel)',
  borderRadius: 3, cursor: 'pointer', color: 'var(--text-2)',
  fontFamily: 'var(--sans)',
};

function abbr(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
function shorten(s) {
  return s.replace('Mainframe ', 'MF ').replace('PostgreSQL', 'PG').replace('Oracle', 'Ora').replace('Linux / ', '');
}

Object.assign(window, { Site });
