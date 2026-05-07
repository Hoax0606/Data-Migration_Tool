/* Dashboard — Migration Readiness.
   Shows per-TO-BE-table mapping/approval state at a glance, NOT run progress
   (run progress lives in the Execution tab). Answers: "is the mapping done?
   what's blocking the next run?" */

const Dashboard = ({ project, onTabChange }) => {
  const [filter, setFilter] = React.useState('all');
  const [sortKey, setSortKey] = React.useState('name');
  const [sortDir, setSortDir] = React.useState('asc');

  const { rows, counts, lastRun, latestSnapshot } = React.useMemo(() => {
    const tobe = window.getTobeInventory?.() || [];
    const snapshots = window.getSnapshots?.(project?.id) || [];
    const latestApproved = [...snapshots].reverse().find(s => s.status === 'approved');
    const latestPending  = [...snapshots].reverse().find(s => s.status === 'pending');
    const latest = snapshots[snapshots.length - 1];
    const lr = (window.getRuns?.(project?.id) || [])[0];

    const rs = tobe.map(t => {
      const mappings = t.internalName ? (window.getColumnMappings?.(t.internalName) || []) : [];
      const errs     = mappings.filter(m => m.status === 'err').length;
      const warns    = mappings.filter(m => m.status === 'warn').length;
      const skips    = mappings.filter(m => m.rule === 'skip').length;
      const unmapped = mappings.filter(m => m.rule === 'unmapped').length;
      const added    = mappings.filter(m => m.rule === 'added').length;
      /* coverage 분모는 "사용자가 매핑해야 하는 컬럼"만 — added(신규, default로 자동
         채움)와 skip(드롭)은 작업 대상이 아니므로 분모/분자 모두에서 제외. */
      const matchable = mappings.filter(m => m.rule !== 'skip' && m.rule !== 'added');
      const total    = matchable.length;
      const mappedOk = matchable.filter(m => m.status === 'ok').length;
      const unbound  = !t.internalName || (t.sources?.length === 0);

      let readiness;
      if (unbound) readiness = 'unbound';
      else if (errs > 0) readiness = 'review';
      else if (unmapped > 0) readiness = 'review';
      else if (!latestApproved) readiness = 'review';
      else if (warns > 0) readiness = 'review';
      else readiness = 'ready';

      return {
        name: t.name,
        tableShort: t.tableShort,
        internalName: t.internalName,
        sources: t.sources || [],
        compositionKind: t.compositionKind,
        mappedOk, total, errs, warns, skips, unmapped,
        coverage: total > 0 ? mappedOk / total : 0,
        approvalLabel: latestApproved ? `v${latestApproved.version} ✓`
          : latestPending ? `v${latestPending.version} pending`
          : '—',
        approvalState: latestApproved ? 'approved' : latestPending ? 'pending' : 'none',
        readiness,
        unbound,
      };
    });
    return {
      rows: rs,
      counts: {
        total: rs.length,
        ready: rs.filter(r => r.readiness === 'ready').length,
        review: rs.filter(r => r.readiness === 'review').length,
        unbound: rs.filter(r => r.readiness === 'unbound').length,
        approved: latestApproved ? 1 : 0,
      },
      lastRun: lr,
      latestSnapshot: latest,
    };
  }, [project]);

  const filtered = rows
    .filter(r =>
      filter === 'all' ? true
      : filter === 'unbound' ? r.readiness === 'unbound'
      : filter === 'review' ? r.readiness === 'review'
      : filter === 'ready' ? r.readiness === 'ready'
      : filter === 'partial' ? (r.errs > 0 || r.warns > 0 || r.unmapped > 0) && !r.unbound
      : true
    )
    .sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      const cmp = typeof va === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const Header = ({ k, w, label, align = 'left' }) => (
    <th onClick={() => {
      if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortKey(k); setSortDir('asc'); }
    }} style={{
      width: w, textAlign: align, padding: '6px 10px',
      fontWeight: 500, color: 'var(--text-3)', fontSize: 11,
      textTransform: 'uppercase', letterSpacing: 0.6,
      borderBottom: '1px solid var(--border)',
      background: 'var(--panel-2)', cursor: 'pointer', userSelect: 'none',
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
      {/* KPI strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
        <DStat label="TO-BE tables" value={counts.total}/>
        <DStat label="Ready"   value={counts.ready}   tone="ok"   sub="all checks pass"/>
        <DStat label="Review"  value={counts.review}  tone="warn" sub="errs / pending approval"/>
        <DStat label="Unbound" value={counts.unbound} tone="err"  sub="no source assigned"/>
        <DStat label="Snapshot" value={latestSnapshot ? `v${latestSnapshot.version}` : '—'} sub={latestSnapshot ? latestSnapshot.status : 'no snapshot yet'} tone={latestSnapshot?.status === 'approved' ? 'ok' : latestSnapshot?.status === 'pending' ? 'warn' : 'idle'}/>
        <DStat label="Last run" value={lastRun ? lastRun.result : '—'} sub={lastRun ? lastRun.startedAt.split(' ')[0] : 'no run yet'} tone={lastRun?.result === 'ok' ? 'ok' : lastRun?.result === 'warn' ? 'warn' : lastRun?.result === 'running' ? 'warn' : 'idle'}/>
      </div>

      {/* Filter chips */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{ display: 'flex', height: 26, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--panel)' }}>
          {[
            ['all', 'All', counts.total],
            ['ready', 'Ready', counts.ready],
            ['review', 'Review', counts.review],
            ['partial', 'Partial', rows.filter(r => (r.errs > 0 || r.warns > 0) && !r.unbound).length],
            ['unbound', 'Unbound', counts.unbound],
          ].map(([k, l, n], i) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '0 10px', border: 'none',
              borderLeft: i ? '1px solid var(--border)' : 'none',
              background: filter === k ? 'var(--navy-50)' : 'transparent',
              color: filter === k ? 'var(--navy)' : 'var(--text-2)',
              fontWeight: filter === k ? 600 : 500,
              cursor: 'pointer', fontSize: 12,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>{l} <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{n}</span></button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Btn kind="secondary" size="sm" onClick={() => onTabChange?.('versions')}>Open Versions</Btn>
        <Btn kind="primary" size="sm" onClick={() => onTabChange?.('execution')}>Go to Execution</Btn>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--panel)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              <Header k="readiness" w={28} label=""/>
              <Header k="name" label="TO-BE table"/>
              <Header k="compositionKind" w={150} label="AS-IS source(s)"/>
              <Header k="coverage" w={220} label="Column coverage"/>
              <Header k="errs" w={70} label="Issues" align="right"/>
              <Header k="approvalState" w={150} label="Approval"/>
              <Header k="readiness" w={110} label="Readiness"/>
              <th style={{ width: 30, padding: '6px 10px', background: 'var(--panel-2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}/>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.name}
                onClick={() => onTabChange?.('mapping')}
                style={{
                  background: i % 2 === 1 ? 'var(--zebra)' : 'var(--panel)',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? 'var(--zebra)' : 'var(--panel)'}
              >
                <td className="mig-td"><ReadinessDot kind={r.readiness}/></td>
                <td className="mig-td" style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{r.name}</td>
                <td className="mig-td" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                  {r.unbound ? <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>(no source)</span>
                    : r.sources.map((s, si) => (
                      <React.Fragment key={s.alias || si}>
                        {si > 0 && <span style={{ color: 'var(--text-4)' }}> {r.compositionKind === 'union' ? '∪' : '⋈'} </span>}
                        <span style={{ color: 'var(--text-2)' }}>{s.table?.split('.').pop() || s.table}</span>
                      </React.Fragment>
                    ))
                  }
                </td>
                <td className="mig-td">
                  {r.unbound ? (
                    <span style={{ color: 'var(--text-4)', fontSize: 11, fontFamily: 'var(--mono)' }}>—</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar pct={r.coverage * 100} tone={r.errs > 0 ? 'err' : r.warns > 0 || r.unmapped > 0 ? 'warn' : 'ok'}/>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', minWidth: 96, textAlign: 'right' }}>
                        {r.mappedOk}/{r.total}{r.unmapped ? ` · ${r.unmapped} open` : ''}{r.skips ? ` · ${r.skips}↓` : ''}
                      </span>
                    </div>
                  )}
                </td>
                <td className="mig-td" style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5 }}>
                  {r.errs > 0 && <span style={{ color: 'var(--red)', fontWeight: 600 }}>{r.errs} err</span>}
                  {r.errs > 0 && (r.warns > 0 || r.unmapped > 0) && <span style={{ color: 'var(--text-4)' }}> · </span>}
                  {r.warns > 0 && <span style={{ color: 'var(--amber)' }}>{r.warns} warn</span>}
                  {r.warns > 0 && r.unmapped > 0 && <span style={{ color: 'var(--text-4)' }}> · </span>}
                  {r.unmapped > 0 && <span style={{ color: 'var(--text-3)' }}>{r.unmapped} unmapped</span>}
                  {r.errs === 0 && r.warns === 0 && r.unmapped === 0 && <span style={{ color: 'var(--text-4)' }}>—</span>}
                </td>
                <td className="mig-td">
                  <ApprovalChip state={r.approvalState} label={r.approvalLabel} onClick={(e) => { e.stopPropagation(); onTabChange?.('versions'); }}/>
                </td>
                <td className="mig-td">
                  <ReadinessBadge kind={r.readiness}/>
                </td>
                <td className="mig-td" style={{ textAlign: 'right', color: 'var(--text-3)' }}>
                  <Ic.chevR/>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                  no tables match this filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        height: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderTop: '1px solid var(--border)',
        background: 'var(--panel-2)',
        fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)',
      }}>
        <span>{filtered.length} of {rows.length} tables · sort: {sortKey} {sortDir}</span>
        <span>click a row → Mapping tab · click approval chip → Versions tab</span>
      </div>
    </div>
  );
};

const DStat = ({ label, value, sub, tone }) => (
  <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid var(--border)' }}>
    <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <div style={{
        fontSize: 22, fontWeight: 600, fontFamily: 'var(--mono)', letterSpacing: -0.3,
        color: tone === 'err' ? 'var(--red)' : tone === 'warn' ? 'var(--amber)' : tone === 'ok' ? 'var(--green)' : tone === 'idle' ? 'var(--text-3)' : 'var(--text)',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{sub}</div>}
    </div>
  </div>
);

const ReadinessDot = ({ kind }) => {
  const c = kind === 'ready' ? 'var(--green)' : kind === 'unbound' ? 'var(--red)' : 'var(--amber)';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c }}/>;
};

const ReadinessBadge = ({ kind }) => {
  const tone = kind === 'ready' ? 'ok' : kind === 'unbound' ? 'err' : 'warn';
  const label = kind === 'ready' ? 'ready' : kind === 'unbound' ? 'unbound' : 'review';
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
};

const ApprovalChip = ({ state, label, onClick }) => {
  const tone = state === 'approved' ? 'ok' : state === 'pending' ? 'warn' : 'idle';
  return (
    <button onClick={onClick} style={{
      border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
    }}>
      <StatusBadge tone={tone}>{label}</StatusBadge>
    </button>
  );
};

window.Dashboard = Dashboard;
