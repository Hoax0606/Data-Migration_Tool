/* Versions tab — mapping snapshots, approval workflow, audit log.
   Runs require the latest approved snapshot (gated via Preflight check). */

const Versions = ({ project }) => {
  const initial = React.useMemo(
    () => (window.getSnapshots ? window.getSnapshots(project.id) : []),
    [project.id]
  );
  /* Local snapshots state — edits (approve/request changes/new snapshot)
     live here. Real tool persists server-side and audit-logs each action. */
  const [snapshots, setSnapshots] = React.useState(initial);
  const [selectedId, setSelectedId] = React.useState(() => {
    const pending = initial.find(s => s.status === 'pending');
    return pending?.id || initial[initial.length - 1]?.id || null;
  });
  const [showAudit, setShowAudit] = React.useState(true);
  const auditBase = window.getAuditLog ? window.getAuditLog(project.id) : [];

  /* Derive effective "current draft" — synthetic row representing any
     uncommitted edits since the last snapshot. Mock: if the most recent
     snapshot is approved, show a small draft entry. */
  const hasDraft = snapshots.length > 0 && snapshots[snapshots.length - 1].status === 'approved' && project.id === 'p1';
  const draftChanges = hasDraft ? 3 : 0;

  const selected = snapshots.find(s => s.id === selectedId)
    || (selectedId === 'draft' ? { id: 'draft', version: 'draft', status: 'draft' } : null);

  const latestApproved = [...snapshots].reverse().find(s => s.status === 'approved');
  const pendingCount   = snapshots.filter(s => s.status === 'pending').length;

  const handleApprove = (id) => {
    setSnapshots(list => list.map(s => s.id === id ? {
      ...s, status: 'approved', approvedBy: 'Reviewer', approvedAt: 'just now',
    } : s));
  };
  const handleReject = (id) => {
    setSnapshots(list => list.map(s => s.id === id ? {
      ...s, status: 'rejected', rejectedBy: 'Reviewer', rejectedAt: 'just now',
      rejectReason: '(mock) 리뷰어가 수정을 요청했습니다',
    } : s));
  };
  const handleSnapshot = () => {
    const nextVer = snapshots.length === 0 ? '1.0'
      : bumpVersion(snapshots[snapshots.length - 1].version);
    const snap = {
      id: `${project.id}-v${nextVer}-${Date.now()}`,
      version: nextVer,
      createdAt: 'just now',
      author: 'Admin',
      notes: `Snapshotted from draft (${draftChanges} changes)`,
      status: 'pending',
      reviewer: 'Reviewer',
      changes: Array.from({ length: draftChanges }, (_, i) => ({
        kind: 'modified', target: `mock.change.${i + 1}`, detail: '(mock — prototype does not track real edits)',
      })),
    };
    setSnapshots(list => [...list, snap]);
    setSelectedId(snap.id);
  };

  if (snapshots.length === 0) {
    return <VersionsEmpty projectName={project.name} onSnapshot={handleSnapshot} hasDraft={hasDraft}/>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <StatusBanner
        latestApproved={latestApproved}
        pendingCount={pendingCount}
        hasDraft={hasDraft}
        draftChanges={draftChanges}
        onSnapshot={handleSnapshot}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <VersionsList
          snapshots={snapshots}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hasDraft={hasDraft}
          draftChanges={draftChanges}
        />
        <VersionDetail
          snapshot={selected}
          hasDraft={hasDraft}
          draftChanges={draftChanges}
          onApprove={() => selected && handleApprove(selected.id)}
          onReject={() => selected && handleReject(selected.id)}
          onSnapshot={handleSnapshot}
        />
      </div>

      <AuditLogStrip entries={auditBase} open={showAudit} onToggle={() => setShowAudit(o => !o)}/>
    </div>
  );
};

const bumpVersion = (v) => {
  const parts = v.split('.').map(Number);
  parts[parts.length - 1] = (parts[parts.length - 1] || 0) + 1;
  return parts.join('.');
};

/* ─── Status banner ─────────────────────────────────────────────── */

const StatusBanner = ({ latestApproved, pendingCount, hasDraft, draftChanges, onSnapshot }) => {
  const tone = hasDraft || pendingCount > 0 ? 'warn' : 'ok';
  const bg = tone === 'warn' ? 'var(--amber-50)' : 'var(--green-50)';
  const bd = tone === 'warn' ? 'var(--amber)' : 'var(--green)';
  return (
    <div style={{
      padding: '10px 18px',
      borderBottom: '1px solid var(--border)',
      background: bg,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: bd, flexShrink: 0 }}/>
      <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
        {latestApproved ? (
          <>
            <b>v{latestApproved.version}</b> 승인됨 · {latestApproved.approvedAt} by {latestApproved.approvedBy}
          </>
        ) : (
          <>승인된 스냅샷 없음</>
        )}
        {pendingCount > 0 && <span style={{ marginLeft: 10, color: 'var(--amber)' }}>· {pendingCount} pending review</span>}
        {hasDraft && <span style={{ marginLeft: 10, color: 'var(--amber)' }}>· {draftChanges} uncommitted changes</span>}
      </div>
      {hasDraft && (
        <Btn kind="primary" size="sm" icon={<Ic.plus/>} onClick={onSnapshot}>Snapshot draft → v…</Btn>
      )}
    </div>
  );
};

/* ─── Versions list (left pane) ──────────────────────────────────── */

const VersionsList = ({ snapshots, selectedId, onSelect, hasDraft, draftChanges }) => (
  <aside style={{
    width: 240, minWidth: 240,
    borderRight: '1px solid var(--border)',
    background: 'var(--panel)',
    overflow: 'auto', padding: '8px 0',
  }}>
    <div style={{ padding: '0 12px 6px', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
      Snapshots
    </div>
    {hasDraft && (
      <VersionItem
        snapshot={{ id: 'draft', version: 'draft', status: 'draft', notes: `${draftChanges} uncommitted changes`, author: 'Admin' }}
        selected={selectedId === 'draft'}
        onSelect={() => onSelect('draft')}
      />
    )}
    {[...snapshots].reverse().map(s => (
      <VersionItem
        key={s.id}
        snapshot={s}
        selected={selectedId === s.id}
        onSelect={() => onSelect(s.id)}
      />
    ))}
  </aside>
);

const VersionItem = ({ snapshot, selected, onSelect }) => {
  const s = snapshot.status;
  const tone = s === 'approved' ? 'ok' : s === 'pending' ? 'warn' : s === 'rejected' ? 'err' : 'queued';
  const bd = s === 'approved' ? 'var(--green)' : s === 'pending' ? 'var(--amber)' : s === 'rejected' ? 'var(--red)' : 'var(--border-strong)';
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '8px 12px',
        borderLeft: selected ? `2px solid ${bd}` : '2px solid transparent',
        background: selected ? 'var(--panel-2)' : 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--panel-2)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>
          {snapshot.version === 'draft' ? 'draft' : `v${snapshot.version}`}
        </span>
        <div style={{ flex: 1 }}/>
        <StatusBadge tone={tone}>{s}</StatusBadge>
      </div>
      <div style={{
        fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {snapshot.createdAt || '—'} · {snapshot.author}
      </div>
      {snapshot.notes && (
        <div style={{
          fontSize: 11, color: 'var(--text-2)', marginTop: 3, lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {snapshot.notes}
        </div>
      )}
    </div>
  );
};

/* ─── Version detail (right pane) ────────────────────────────────── */

const VersionDetail = ({ snapshot, hasDraft, draftChanges, onApprove, onReject, onSnapshot }) => {
  if (!snapshot) return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: 12 }}>
      좌측에서 스냅샷을 선택하세요.
    </div>
  );

  if (snapshot.id === 'draft') {
    return (
      <div style={{ flex: 1, padding: '18px 22px', overflow: 'auto' }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Draft</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Uncommitted changes</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>
          {draftChanges} 개의 변경사항이 아직 스냅샷으로 찍히지 않았습니다.
          스냅샷으로 묶어야 리뷰어에게 승인 요청을 보낼 수 있습니다.
        </div>
        <Btn kind="primary" size="sm" icon={<Ic.plus/>} onClick={onSnapshot}>Snapshot draft</Btn>
      </div>
    );
  }

  const s = snapshot.status;
  return (
    <div style={{ flex: 1, padding: '18px 22px', overflow: 'auto', minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Snapshot</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--mono)', marginBottom: 6 }}>v{snapshot.version}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            created {snapshot.createdAt} by {snapshot.author}
          </div>
        </div>
        <StatusBadge tone={s === 'approved' ? 'ok' : s === 'pending' ? 'warn' : s === 'rejected' ? 'err' : 'queued'}>
          {s}
        </StatusBadge>
      </div>

      {/* Notes */}
      {snapshot.notes && (
        <div style={{
          padding: 12, marginBottom: 14,
          border: '1px solid var(--border)', borderRadius: 4,
          background: 'var(--panel-2)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55,
        }}>
          {snapshot.notes}
        </div>
      )}

      {/* Approval card */}
      <ApprovalCard snapshot={snapshot} onApprove={onApprove} onReject={onReject}/>

      {/* Changes */}
      <ChangesDiff snapshot={snapshot}/>
    </div>
  );
};

const ApprovalCard = ({ snapshot, onApprove, onReject }) => {
  const s = snapshot.status;
  if (s === 'approved') {
    return (
      <div style={{
        padding: '10px 14px', marginBottom: 14,
        border: '1px solid var(--green)', background: 'var(--green-50)',
        borderRadius: 4, fontSize: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Approved</span>
        <span style={{ color: 'var(--text-2)' }}>
          by <b>{snapshot.approvedBy}</b> · {snapshot.approvedAt}
        </span>
      </div>
    );
  }
  if (s === 'rejected') {
    return (
      <div style={{
        padding: '10px 14px', marginBottom: 14,
        border: '1px solid var(--red)', background: 'var(--red-50)',
        borderRadius: 4, fontSize: 12,
      }}>
        <div style={{ color: 'var(--red)', fontWeight: 600 }}>✗ Changes requested</div>
        <div style={{ color: 'var(--text-2)', marginTop: 3 }}>
          by <b>{snapshot.rejectedBy || 'reviewer'}</b> · {snapshot.rejectedAt || ''}
        </div>
        {snapshot.rejectReason && (
          <div style={{ marginTop: 6, fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
            {snapshot.rejectReason}
          </div>
        )}
      </div>
    );
  }
  /* pending */
  return (
    <div style={{
      padding: '12px 14px', marginBottom: 14,
      border: '1px solid var(--amber)', background: 'var(--amber-50)',
      borderRadius: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color: 'var(--amber)', fontWeight: 600, fontSize: 12 }}>⧗ Pending review</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
          reviewer: <b>{snapshot.reviewer || '—'}</b>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn kind="primary" size="sm" icon={<Ic.check/>} onClick={onApprove}>Approve</Btn>
        <Btn kind="secondary" size="sm" onClick={onReject}>Request changes</Btn>
        <div style={{ flex: 1 }}/>
        <Btn kind="ghost" size="sm" onClick={() => alert('v1: 리뷰어 변경 피커를 엽니다.')}>Reassign reviewer</Btn>
      </div>
    </div>
  );
};

const ChangesDiff = ({ snapshot }) => {
  const changes = snapshot.changes || [];
  if (changes.length === 0) {
    return (
      <div>
        <SectionLabel label="Changes vs previous"/>
        <div style={{ padding: 14, border: '1px dashed var(--border)', borderRadius: 4, fontSize: 11.5, color: 'var(--text-3)' }}>
          초기 스냅샷 — 비교 대상이 없습니다.
        </div>
      </div>
    );
  }
  const counts = changes.reduce((a, c) => { a[c.kind] = (a[c.kind] || 0) + 1; return a; }, {});
  return (
    <div>
      <SectionLabel label={`Changes vs previous (${changes.length})`}>
        <div style={{ display: 'flex', gap: 5 }}>
          {counts.added    && <StatusBadge tone="ok">{counts.added} added</StatusBadge>}
          {counts.modified && <StatusBadge tone="info">{counts.modified} modified</StatusBadge>}
          {counts.removed  && <StatusBadge tone="err">{counts.removed} removed</StatusBadge>}
        </div>
      </SectionLabel>
      <div style={{ border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel)', overflow: 'hidden' }}>
        {changes.map((c, i) => {
          const tone = c.kind === 'added' ? 'ok' : c.kind === 'removed' ? 'err' : 'info';
          const bar = tone === 'ok' ? 'var(--green)' : tone === 'err' ? 'var(--red)' : 'var(--navy)';
          const sign = c.kind === 'added' ? '+' : c.kind === 'removed' ? '−' : '~';
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '18px 80px 1fr auto',
              alignItems: 'center', gap: 10,
              padding: '7px 12px',
              borderBottom: i < changes.length - 1 ? '1px solid var(--border)' : 'none',
              borderLeft: `3px solid ${bar}`,
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: bar, textAlign: 'center' }}>{sign}</span>
              <StatusBadge tone={tone}>{c.kind}</StatusBadge>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.target}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{c.detail}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SectionLabel = ({ label, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
    fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8,
  }}>
    <span>{label}</span>
    <div style={{ flex: 1 }}/>
    {children}
  </div>
);

/* ─── Empty state for projects without snapshots ─────────────────── */

const VersionsEmpty = ({ projectName, onSnapshot, hasDraft }) => (
  <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 32 }}>
    <div style={{
      maxWidth: 520, padding: 24,
      border: '1px dashed var(--border-strong)', borderRadius: 6,
      background: 'var(--panel)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
        No snapshots yet
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{projectName}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>
        매핑 스냅샷은 현재 매핑 상태를 버전으로 고정해 리뷰·승인·실행의 단위로 삼습니다.
        Run 을 시작하려면 최소 한 개의 <b>approved</b> 스냅샷이 필요합니다.
      </div>
      <Btn kind="primary" size="sm" icon={<Ic.plus/>} onClick={onSnapshot}>
        Snapshot {hasDraft ? 'draft' : 'current state'} → v1.0
      </Btn>
    </div>
  </div>
);

/* ─── Audit log (bottom strip) ───────────────────────────────────── */

const AuditLogStrip = ({ entries, open, onToggle }) => {
  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--panel)' }}>
      <div onClick={onToggle} style={{
        padding: '8px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}>
        <span style={{ color: 'var(--text-4)', fontSize: 10, width: 10 }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text-2)' }}>
          Audit log
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>{entries.length} events</span>
        <div style={{ flex: 1 }}/>
        {!open && entries[0] && (
          <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
            latest: {entries[0].at} · {entries[0].actor} {entries[0].action} {entries[0].target}
          </span>
        )}
      </div>
      {open && (
        <div style={{ maxHeight: 180, overflow: 'auto', padding: '0 18px 10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <tbody>
              {entries.map((e, i) => {
                const tone = e.action === 'approved' ? 'var(--green)'
                  : e.action === 'rejected' || e.action === 'run-failed' ? 'var(--red)'
                  : e.action === 'snapshot' ? 'var(--navy)'
                  : 'var(--text-3)';
                return (
                  <tr key={i} style={{ borderBottom: i < entries.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                    <td style={{ padding: '3px 8px', fontFamily: 'var(--mono)', color: 'var(--text-4)', whiteSpace: 'nowrap', width: 140 }}>{e.at}</td>
                    <td style={{ padding: '3px 8px', fontFamily: 'var(--mono)', fontWeight: 500, width: 110 }}>{e.actor}</td>
                    <td style={{ padding: '3px 8px', fontWeight: 600, color: tone, width: 90 }}>{e.action}</td>
                    <td style={{ padding: '3px 8px', fontFamily: 'var(--mono)', color: 'var(--text)', whiteSpace: 'nowrap' }}>{e.target}</td>
                    <td style={{ padding: '3px 8px', fontSize: 11, color: 'var(--text-3)' }}>{e.detail}</td>
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

window.Versions = Versions;
