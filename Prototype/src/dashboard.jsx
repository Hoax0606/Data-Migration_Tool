/* Dashboard tab — table-level migration status */

const Stat = ({ label, value, sub, tone }) => (
  <div style={{
    flex: 1,
    padding: '10px 14px',
    borderRight: '1px solid var(--border)',
  }}>
    <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)', color: tone === 'err' ? 'var(--red)' : tone === 'warn' ? 'var(--amber)' : tone === 'ok' ? 'var(--green)' : 'var(--text)', letterSpacing: -0.3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{sub}</div>}
    </div>
  </div>
);

const Dashboard = ({ tables }) => {
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [sortKey, setSortKey] = React.useState('name');
  const [sortDir, setSortDir] = React.useState('asc');
  const [sel, setSel] = React.useState(new Set());

  const totals = React.useMemo(() => {
    const total = tables.reduce((a, t) => a + t.rows, 0);
    const done = tables.reduce((a, t) => a + t.done, 0);
    const ok = tables.filter(t => t.status === 'ok').length;
    const running = tables.filter(t => t.status === 'running' || t.status === 'warn').length;
    const errs = tables.filter(t => t.status === 'blocked' || t.status === 'warn').length;
    return { total, done, pct: (done / total) * 100, ok, running, errs, count: tables.length };
  }, [tables]);

  let rows = tables.filter(t =>
    (!q || t.name.toLowerCase().includes(q.toLowerCase()) || t.schema.toLowerCase().includes(q.toLowerCase()))
    && (filter === 'all' || t.status === filter || (filter === 'issues' && (t.status === 'blocked' || t.status === 'warn')))
  );
  rows = [...rows].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSel = id => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };

  const Header = ({ k, w, label, align = 'left' }) => (
    <th onClick={() => {
      if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortKey(k); setSortDir('asc'); }
    }}
    style={{
      width: w,
      textAlign: align,
      padding: '6px 10px',
      fontWeight: 500,
      color: 'var(--text-3)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      borderBottom: '1px solid var(--border)',
      background: 'var(--panel-2)',
      cursor: 'pointer',
      userSelect: 'none',
      position: 'sticky', top: 0,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {sortKey === k && <span style={{ color: 'var(--navy)', fontSize: 9 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Summary strip */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <Stat label="Tables" value={totals.count} sub={`${totals.ok} complete`}/>
        <Stat label="Rows migrated" value={`${(totals.done/1e6).toFixed(1)}M`} sub={`of ${(totals.total/1e6).toFixed(1)}M`}/>
        <Stat label="Overall progress" value={fmtPct(totals.pct)} tone="ok"/>
        <Stat label="In progress" value={totals.running} sub="active" tone="warn"/>
        <Stat label="Issues" value={totals.errs} sub={totals.errs > 0 ? 'attention' : 'none'} tone={totals.errs > 0 ? 'err' : 'ok'}/>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 26, padding: '0 8px', minWidth: 260,
          border: '1px solid var(--border)', borderRadius: 4,
          background: 'var(--panel-2)',
          color: 'var(--text-3)',
        }}>
          <Ic.search/>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Filter tables or schemas…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' }}
          />
        </div>

        <div style={{
          display: 'flex', height: 26,
          border: '1px solid var(--border)', borderRadius: 4,
          overflow: 'hidden',
          background: 'var(--panel)',
        }}>
          {[
            { k: 'all', l: `All` },
            { k: 'running', l: 'Running' },
            { k: 'ok', l: 'Complete' },
            { k: 'queued', l: 'Queued' },
            { k: 'issues', l: 'Issues' },
          ].map((f, i) => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '0 10px',
              border: 'none',
              borderLeft: i ? '1px solid var(--border)' : 'none',
              background: filter === f.k ? 'var(--navy-50)' : 'transparent',
              color: filter === f.k ? 'var(--navy)' : 'var(--text-2)',
              fontWeight: filter === f.k ? 600 : 500,
              cursor: 'pointer',
              fontSize: 12,
            }}>{f.l}</button>
          ))}
        </div>

        <div style={{ flex: 1 }}/>
        {sel.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontFamily: 'var(--mono)' }}>{sel.size} selected</span>
            <Btn kind="secondary" size="sm" icon={<Ic.play/>}>Run</Btn>
            <Btn kind="danger" size="sm" onClick={() => setSel(new Set())}>Reset</Btn>
          </div>
        )}
        <Btn kind="primary" size="sm" icon={<Ic.play/>}>Run all</Btn>
        <Btn kind="secondary" size="sm">Abort run</Btn>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--panel)' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}>
          <thead>
            <tr>
              <th style={{ width: 28, padding: '6px 10px', background: 'var(--panel-2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                <input type="checkbox"
                  checked={sel.size === rows.length && rows.length > 0}
                  onChange={e => setSel(e.target.checked ? new Set(rows.map(r => r.name)) : new Set())}
                  style={{ margin: 0 }}
                />
              </th>
              <Header k="status" w={28} label=""/>
              <Header k="name" label="Table"/>
              <Header k="schema" w={120} label="Schema"/>
              <Header k="rows" w={130} label="Rows" align="right"/>
              <Header k="done" w={130} label="Migrated" align="right"/>
              <Header k="pct" w={220} label="Progress"/>
              <Header k="rule" w={70} label="Rules" align="right"/>
              <Header k="issues" w={70} label="Issues" align="right"/>
              <Header k="status" w={100} label="Status"/>
              <Header k="updated" w={110} label="Last update"/>
              <th style={{ width: 40, padding: '6px 10px', background: 'var(--panel-2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const isSel = sel.has(t.name);
              return (
                <tr key={t.name}
                  className="mig-row"
                  style={{
                    background: isSel ? 'var(--navy-50)' : (i % 2 === 1 ? 'var(--zebra)' : 'var(--panel)'),
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--panel-2)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = i % 2 === 1 ? 'var(--zebra)' : 'var(--panel)'; }}
                >
                  <td className="mig-td" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleSel(t.name)} style={{ margin: 0 }}/>
                  </td>
                  <td className="mig-td">
                    <StatusDot tone={t.status}/>
                  </td>
                  <td className="mig-td" style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text)' }}>
                    {t.name}
                  </td>
                  <td className="mig-td" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{t.schema}</td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{fmtN(t.rows)}</td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{fmtN(t.done)}</td>
                  <td className="mig-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar pct={t.pct} tone={t.status === 'ok' ? 'ok' : t.status === 'blocked' ? 'err' : t.status === 'warn' ? 'warn' : t.status === 'queued' ? 'idle' : 'running'}/>
                      </div>
                      <div style={{ width: 42, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                        {t.pct === 0 ? '—' : t.pct === 100 ? '100%' : t.pct.toFixed(1) + '%'}
                      </div>
                    </div>
                  </td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{t.rule}</td>
                  <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: t.issues ? 'var(--red)' : 'var(--text-4)', fontWeight: t.issues ? 600 : 400 }}>
                    {t.issues || '—'}
                  </td>
                  <td className="mig-td">
                    <StatusBadge tone={t.status}>{t.status}</StatusBadge>
                  </td>
                  <td className="mig-td" style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-3)' }}>{t.updated}</td>
                  <td className="mig-td" style={{ textAlign: 'right', color: 'var(--text-3)' }}>
                    <button style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 2 }}><Ic.chevR/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer status */}
      <div style={{
        height: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
        borderTop: '1px solid var(--border)',
        background: 'var(--panel-2)',
        fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)',
      }}>
        <span>{rows.length} of {tables.length} tables · sort: {sortKey} {sortDir}</span>
        <span>auto-refresh 5s · last 09:41:08 JST</span>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
