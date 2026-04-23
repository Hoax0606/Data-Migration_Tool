/* Mapping tab — DDL-state-aware dual inventory (AS-IS + TO-BE) with
   collapsible table-level binding and column-level mapping detail.
   Handles all four DDL states: both / asis-only / tobe-only / neither. */

const Mapping = ({ project }) => {
  const hasAsis = !!project?.ddl?.asis;
  const hasTobe = !!project?.ddl?.tobe;

  if (!hasAsis && !hasTobe) {
    return <GlobalEmpty project={project} which="both"/>;
  }
  return <FullMapping project={project} hasAsis={hasAsis} hasTobe={hasTobe}/>;
};

/* ─── Main dual-pane mapping UI ─────────────────────────────────── */

const FullMapping = ({ project, hasAsis, hasTobe }) => {
  /* bindingsVersion is bumped whenever a SCHEMA_DIFF.sources entry is mutated
     via updateBinding. Every inventory/detail memo re-runs so the sidebar
     badges, CollapsibleBinding, and source-alias tags stay in sync. */
  const [bindingsVersion, setBindingsVersion] = React.useState(0);

  const asisInventory = React.useMemo(() => hasAsis ? window.getAsisInventory() : [], [hasAsis, bindingsVersion]);
  const tobeInventory = React.useMemo(() => hasTobe ? window.getTobeInventory() : [], [hasTobe, bindingsVersion]);

  const updateBinding = React.useCallback((internalName, updater) => {
    const sd = (window.SCHEMA_DIFF || []).find(s => s.table === internalName);
    if (!sd) return;
    const current = sd.sources || (sd.asis
      ? [{ alias: genAlias(sd.asis, []), table: sd.asis, role: 'primary' }]
      : []);
    const next = updater(current);
    sd.sources = (next && next.length > 0) ? next : undefined;
    setBindingsVersion(v => v + 1);
  }, []);

  /* Default selection: first TO-BE with mapping if we have TO-BE, else first AS-IS */
  const [sel, setSel] = React.useState(() => {
    if (hasTobe && tobeInventory.length) {
      const routed = tobeInventory.find(t => !t.unrouted) || tobeInventory[0];
      return { side: 'tobe', name: routed.name, internalName: routed.internalName };
    }
    if (hasAsis && asisInventory.length) {
      return { side: 'asis', name: asisInventory[0].name };
    }
    return null;
  });

  /* If DDL flags flip (e.g. user deletes a DDL), drop any stale selection
     that targets a now-unavailable side. */
  React.useEffect(() => {
    if (sel?.side === 'tobe' && !hasTobe) {
      setSel(hasAsis && asisInventory.length ? { side: 'asis', name: asisInventory[0].name } : null);
    } else if (sel?.side === 'asis' && !hasAsis) {
      const first = tobeInventory.find(t => !t.unrouted) || tobeInventory[0];
      setSel(hasTobe && first ? { side: 'tobe', name: first.name, internalName: first.internalName } : null);
    }
  }, [hasAsis, hasTobe]);

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <DualInventory
        project={project}
        hasAsis={hasAsis} hasTobe={hasTobe}
        asis={asisInventory} tobe={tobeInventory}
        selected={sel} onSelect={setSel}
      />
      <MappingWorkspace
        selected={sel}
        hasAsis={hasAsis} hasTobe={hasTobe}
        onSelect={setSel}
        updateBinding={updateBinding}
        asisInventory={asisInventory}
        tobeInventory={tobeInventory}
        bindingsVersion={bindingsVersion}
      />
    </div>
  );
};

/* ─── Left: dual inventory sidebar ──────────────────────────────── */

const DualInventory = ({ project, hasAsis, hasTobe, asis, tobe, selected, onSelect }) => {
  const [q, setQ] = React.useState('');
  const [showUnrouted, setShowUnrouted] = React.useState(true);

  const matchQ = (name) => !q || name.toLowerCase().includes(q.toLowerCase());
  const visibleAsis = asis.filter(t => matchQ(t.name) && (showUnrouted || !t.unrouted));
  const visibleTobe = tobe.filter(t => matchQ(t.name) && (showUnrouted || !t.unrouted));

  return (
    <aside style={{
      width: 260, minWidth: 260,
      borderRight: '1px solid var(--border)',
      background: 'var(--panel)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Search + filter header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
          Schema inventory
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          height: 22, padding: '0 6px',
          border: '1px solid var(--border)', borderRadius: 3,
          background: 'var(--panel-2)', color: 'var(--text-3)',
        }}>
          <Ic.search/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter…" style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 11.5, color: 'var(--text)', fontFamily: 'var(--mono)',
          }}/>
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 5, marginTop: 6,
          fontSize: 10.5, color: 'var(--text-3)', cursor: 'pointer',
        }}>
          <input type="checkbox" checked={showUnrouted} onChange={e => setShowUnrouted(e.target.checked)} style={{ margin: 0 }}/>
          show unrouted tables
        </label>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {/* AS-IS tree */}
        <InventoryTree
          label="AS-IS"
          side="asis"
          available={hasAsis}
          ddl={project?.ddl?.asis}
          tables={visibleAsis}
          allTables={asis}
          selected={selected}
          onSelect={onSelect}
        />
        <div style={{ height: 8 }}/>
        {/* TO-BE tree */}
        <InventoryTree
          label="TO-BE"
          side="tobe"
          available={hasTobe}
          ddl={project?.ddl?.tobe}
          tables={visibleTobe}
          allTables={tobe}
          selected={selected}
          onSelect={onSelect}
        />
      </div>
    </aside>
  );
};

const InventoryTree = ({ label, side, available, ddl, tables, allTables, selected, onSelect }) => {
  const [open, setOpen] = React.useState(true);
  const accent = side === 'asis' ? '#b87219' : 'var(--navy)';
  const accentBg = side === 'asis' ? '#fdf0de' : 'var(--navy-50)';
  const accentBd = side === 'asis' ? '#e4c793' : '#c5d3e4';

  /* Coverage stats — derived from allTables (not the filtered view). */
  const stats = React.useMemo(() => {
    const src = allTables || [];
    const routed = src.filter(t => !t.unrouted).length;
    const unrouted = src.length - routed;
    const multi = side === 'asis'
      ? src.filter(t => t.routing && t.routing.length > 1).length
      : src.filter(t => t.compositionKind === 'join' || t.compositionKind === 'union').length;
    return { total: src.length, routed, unrouted, multi };
  }, [allTables, side]);

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '4px 12px 3px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, color: 'var(--text-2)',
          textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600,
        }}>
        <span style={{ width: 8, color: 'var(--text-4)' }}>{open ? '▾' : '▸'}</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9.5,
          padding: '0 5px', borderRadius: 2,
          color: accent, background: accentBg, border: `1px solid ${accentBd}`,
        }}>{label}</span>
        <span style={{ flex: 1 }}/>
        <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)', fontSize: 10 }}>
          {available ? `${stats.routed}/${stats.total}` : '—'}
        </span>
      </div>

      {open && available && stats.total > 0 && (
        <div style={{
          margin: '0 10px 4px 28px',
          display: 'flex', flexWrap: 'wrap', gap: 4,
          fontSize: 9.5, fontFamily: 'var(--mono)',
          textTransform: 'none', letterSpacing: 0, fontWeight: 400,
        }}>
          <span title="routed tables" style={{
            padding: '0 5px', borderRadius: 2,
            background: 'var(--green-50)', color: 'var(--green)',
            border: '1px solid #b7dcc0',
          }}>{stats.routed} routed</span>
          {stats.unrouted > 0 && (
            <span title="tables not bound to anything" style={{
              padding: '0 5px', borderRadius: 2,
              background: 'var(--amber-50)', color: 'var(--amber)',
              border: '1px solid #ebcf8e',
            }}>{stats.unrouted} unrouted</span>
          )}
          {stats.multi > 0 && (
            <span title={side === 'asis' ? 'AS-IS tables that feed multiple TO-BE tables' : 'TO-BE tables composed from multiple sources'}
              style={{
                padding: '0 5px', borderRadius: 2,
                background: 'var(--navy-50)', color: 'var(--navy)',
                border: '1px solid #c5d3e4',
              }}>{stats.multi} {side === 'asis' ? 'multi-target' : 'multi-source'}</span>
          )}
        </div>
      )}

      {open && (
        available ? (
          <>
            {/* DDL source info */}
            {ddl && (
              <div style={{
                margin: '2px 10px 4px', padding: '4px 8px',
                background: 'var(--panel-2)', borderRadius: 2,
                fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--text-3)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={`imported ${ddl.uploadedAt}`}>
                ↳ {ddl.filename}
              </div>
            )}
            {tables.length === 0 && (
              <div style={{ padding: '8px 14px', fontSize: 10.5, color: 'var(--text-3)' }}>no tables match</div>
            )}
            {tables.map(t => (
              <InventoryItem
                key={t.name} side={side} table={t}
                isSelected={selected?.side === side && selected?.name === t.name}
                onClick={() => onSelect({ side, name: t.name, internalName: t.internalName })}
              />
            ))}
          </>
        ) : (
          <div style={{
            margin: '2px 10px 6px',
            padding: '10px 10px', borderRadius: 3,
            border: '1px dashed #e4c793', background: '#fffaf0',
            fontSize: 11, color: '#7a4d05', lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>DDL not imported</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
              {side === 'asis' ? 'AS-IS' : 'TO-BE'} 스키마를 Project Settings &gt; {side === 'asis' ? 'Source' : 'Target'} 에서 업로드하면 이 목록에 테이블이 표시됩니다.
            </div>
          </div>
        )
      )}
    </div>
  );
};

const InventoryItem = ({ side, table, isSelected, onClick }) => {
  const unrouted = table.unrouted;
  const accent = side === 'asis' ? '#b87219' : 'var(--navy)';
  const selBg = side === 'asis' ? '#fdf0de' : 'var(--navy-50)';

  let badgeText = '';
  let badgeTone = null;
  if (side === 'tobe') {
    if (unrouted) { badgeText = 'no source'; badgeTone = 'warn'; }
    else if (table.compositionKind === 'join')  { badgeText = `⋈ ${table.sources.length}`; badgeTone = 'info'; }
    else if (table.compositionKind === 'union') { badgeText = `∪ ${table.sources.length}`; badgeTone = 'info'; }
    else                                         { badgeText = '← 1';           badgeTone = 'ok'; }
  } else {
    if (unrouted) { badgeText = 'unrouted'; badgeTone = 'warn'; }
    else          { badgeText = `→ ${table.routing.length}`; badgeTone = 'ok'; }
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderLeft: isSelected ? `2px solid ${accent}` : '2px solid transparent',
        background: isSelected ? selBg : 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--panel-2)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: isSelected ? 600 : 500,
        color: isSelected ? accent : (unrouted ? 'var(--text-3)' : 'var(--text)'),
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {table.tableShort}
        </span>
        <span style={{
          fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 600,
          padding: '0 4px', borderRadius: 2,
          color: badgeTone === 'warn' ? 'var(--amber)' : badgeTone === 'info' ? 'var(--navy)' : badgeTone === 'ok' ? 'var(--green)' : 'var(--text-4)',
          background: badgeTone === 'warn' ? 'var(--amber-50)' : badgeTone === 'info' ? 'var(--navy-50)' : badgeTone === 'ok' ? 'var(--green-50)' : 'var(--panel-2)',
          border: `1px solid ${badgeTone === 'warn' ? '#ebcf8e' : badgeTone === 'info' ? '#c5d3e4' : badgeTone === 'ok' ? '#b7dcc0' : 'var(--border)'}`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badgeText}</span>
      </div>
      <div style={{
        fontSize: 9.5, color: 'var(--text-4)', fontFamily: 'var(--mono)',
        marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {table.columnCount != null ? `${table.columnCount} cols` : ''}
        {table.rows != null ? ` · ${table.rows >= 1e6 ? (table.rows / 1e6).toFixed(1) + 'M' : table.rows.toLocaleString()} rows` : ''}
      </div>
    </div>
  );
};

/* ─── Right: workspace routes by selection ──────────────────────── */

const MappingWorkspace = ({ selected, hasAsis, hasTobe, onSelect, updateBinding, asisInventory, tobeInventory, bindingsVersion }) => {
  if (!selected) {
    return <GuidePanel hasAsis={hasAsis} hasTobe={hasTobe}/>;
  }
  if (selected.side === 'tobe') {
    const schema = window.getSchemaDiff ? window.getSchemaDiff(selected.internalName) : null;
    if (!schema) {
      return <TobeBindingEmpty tableName={selected.name}/>;
    }
    return <TobeMappingDetail
      tableName={selected.internalName} displayName={selected.name}
      schema={schema} mapping={resolveMapping(selected)}
      hasAsis={hasAsis}
      updateBinding={updateBinding}
      asisInventory={asisInventory}
    />;
  }
  /* AS-IS side */
  return <AsisTableDetail
    tableName={selected.name}
    tobeInventory={tobeInventory}
    updateBinding={updateBinding}
    bindingsVersion={bindingsVersion}
    hasTobe={hasTobe}
    onJumpToTobe={(tobe) => onSelect({ side: 'tobe', name: tobe.name, internalName: tobe.internalName })}
  />;
};

const resolveMapping = (selected) => {
  if (!selected) return null;
  return window.getColumnMappings ? window.getColumnMappings(selected.internalName) : null;
};

/* ─── TO-BE detail — existing column mapping grid + collapsible binding ── */

const TobeMappingDetail = ({ tableName, displayName, schema, mapping, hasAsis, updateBinding, asisInventory }) => {
  const [q, setQ] = React.useState('');
  const [ruleFilter, setRuleFilter] = React.useState('all');
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [bindingOpen, setBindingOpen] = React.useState(false);
  const [inspectorOpen, setInspectorOpen] = React.useState(true);

  React.useEffect(() => {
    if (!mapping) return;
    const idx = mapping.findIndex(r => r.status === 'warn' || r.status === 'err');
    setActiveIdx(idx >= 0 ? idx : 0);
    setBindingOpen(false);
  }, [tableName]);

  /* Row click only updates the active row. If the user closed the Inspector,
     respect that choice — re-open is via the right-edge rail. */
  const selectRow = (idx) => setActiveIdx(idx);

  if (!mapping) return <TobeBindingEmpty tableName={displayName}/>;

  const rows = mapping.filter(r =>
    (!q || (r.src + ' ' + r.tgt).toLowerCase().includes(q.toLowerCase())) &&
    (ruleFilter === 'all' || r.rule === ruleFilter)
  );

  const active = mapping[activeIdx] || mapping[0];
  const counts = {
    all: mapping.length,
    auto:  mapping.filter(r => r.rule === 'auto').length,
    rule:  mapping.filter(r => r.rule === 'rule').length,
    skip:  mapping.filter(r => r.rule === 'skip').length,
    added: mapping.filter(r => r.rule === 'added').length,
  };

  const composition = sourceComposition(schema);
  const tgtLabel = schema?.tobe || `public.${tableName.toLowerCase()}`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Context bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9.5, fontFamily: 'var(--mono)', fontWeight: 700,
            color: 'var(--navy)', background: 'var(--navy-50)',
            border: '1px solid #c5d3e4', borderRadius: 2, padding: '1px 5px',
          }}>TO-BE</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 8px', borderRadius: 4,
            border: '1px solid var(--border)', background: 'var(--panel-2)',
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500,
          }}>
            {tgtLabel}
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          <StatusBadge tone="ok">{counts.auto} passthrough</StatusBadge>
          <StatusBadge tone="info">{counts.rule} transform</StatusBadge>
          <StatusBadge tone="skip">{counts.skip} drop</StatusBadge>
          {counts.added > 0 && <StatusBadge tone="ok">{counts.added} added</StatusBadge>}
        </div>
      </div>

      {/* Collapsible table-level binding */}
      <CollapsibleBinding
        composition={composition}
        tgtTable={tableName}
        internalName={tableName}
        hasAsis={hasAsis}
        open={bindingOpen}
        onToggle={() => setBindingOpen(o => !o)}
        asisInventory={asisInventory}
        updateBinding={updateBinding}
      />

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 26, padding: '0 8px', minWidth: 240,
          border: '1px solid var(--border)', borderRadius: 4,
          background: 'var(--panel-2)', color: 'var(--text-3)',
        }}>
          <Ic.search/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by field name…" style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)',
          }}/>
        </div>
        <div style={{ display: 'flex', height: 26, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--panel)' }}>
          {[
            ['all','All'], ['auto','Passthrough'], ['rule','Transform'],
            ['skip','Drop'], ['added','Added'],
          ].map(([k, l], i) => (
            <button key={k} onClick={() => setRuleFilter(k)} style={{
              padding: '0 10px', border: 'none',
              borderLeft: i ? '1px solid var(--border)' : 'none',
              background: ruleFilter === k ? 'var(--navy-50)' : 'transparent',
              color: ruleFilter === k ? 'var(--navy)' : 'var(--text-2)',
              fontWeight: ruleFilter === k ? 600 : 500,
              fontSize: 12, cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Btn kind="secondary" size="sm" icon={<Ic.download/>} title="Git repo의 매핑 YAML을 가져와 현재 매핑을 덮어씁니다 (v1 planned)">Import YAML</Btn>
        <Btn kind="secondary" size="sm">Auto-map unmapped</Btn>
        <Btn kind="primary" size="sm" icon={<Ic.check/>}>Validate</Btn>
      </div>

      {/* Grid + inspector */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--panel)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                {[
                  { l: '', w: 24 },
                  { l: 'Source field', w: '28%' },
                  { l: 'Src table', w: 60 },
                  { l: 'Source type', w: 170 },
                  { l: '', w: 28 },
                  { l: 'Target field', w: '24%' },
                  { l: 'Target type', w: 140 },
                  { l: 'Rule', w: 60 },
                  { l: 'Status', w: 80 },
                ].map((h, i) => (
                  <th key={i} style={{
                    width: h.w, padding: '6px 10px', textAlign: 'left',
                    fontWeight: 500, fontSize: 11,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6,
                    background: 'var(--panel-2)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky', top: 0,
                  }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const realIdx = mapping.indexOf(r);
                const isActive = realIdx === activeIdx;
                return (
                  <tr key={r.src + '>' + r.tgt + i}
                    onClick={() => selectRow(realIdx)}
                    style={{
                      background: isActive ? 'var(--navy-50)' : (i % 2 === 1 ? 'var(--zebra)' : 'var(--panel)'),
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid var(--navy)' : '2px solid transparent',
                    }}
                  >
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      {r.pk && <span title="primary key" style={{ color: 'var(--navy)', display: 'inline-flex' }}><Ic.key/></span>}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontWeight: 500, color: r.rule === 'skip' ? 'var(--text-3)' : (r.rule === 'added' ? 'var(--text-4)' : 'var(--text)') }}>
                      {r.rule === 'added' ? <span style={{ fontStyle: 'italic' }}>(new in TO-BE)</span> : r.src}
                    </td>
                    <td style={{ padding: '5px 4px' }}>
                      <SourceAliasTag alias={r.sourceAlias} composition={composition}/>
                    </td>
                    <td style={{ padding: '5px 10px' }}>{r.srcType === '—' ? <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>—</span> : <TypeBadge>{r.srcType}</TypeBadge>}</td>
                    <td style={{ padding: '5px 0', textAlign: 'center', color: r.rule === 'skip' ? 'var(--text-4)' : (r.rule === 'added' ? 'var(--green)' : 'var(--text-3)') }}>
                      {r.rule === 'added' ? '+' : <Ic.arrow/>}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontWeight: 500, color: r.rule === 'skip' ? 'var(--text-4)' : 'var(--text)' }}>
                      {r.tgt}
                    </td>
                    <td style={{ padding: '5px 10px' }}>{r.tgtType === '—' ? <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>—</span> : <TypeBadge>{r.tgtType}</TypeBadge>}</td>
                    <td style={{ padding: '5px 10px' }}><RuleTag rule={r.rule}/></td>
                    <td style={{ padding: '5px 10px' }}>
                      {r.status === 'ok'   && <StatusBadge tone="ok">ok</StatusBadge>}
                      {r.status === 'warn' && <StatusBadge tone="warn">warn</StatusBadge>}
                      {r.status === 'err'  && <StatusBadge tone="err">error</StatusBadge>}
                      {r.status === 'skip' && <StatusBadge tone="skip">skip</StatusBadge>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                    no fields match this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {inspectorOpen
          ? <Inspector active={active} composition={composition} onClose={() => setInspectorOpen(false)}/>
          : <InspectorRail onOpen={() => setInspectorOpen(true)}/>}
      </div>
    </div>
  );
};

/* Thin rail shown when the Inspector is hidden. Click to re-open. */
const InspectorRail = ({ onOpen }) => (
  <div
    onClick={onOpen}
    title="Show mapping detail"
    style={{
      width: 22, minWidth: 22,
      borderLeft: '1px solid var(--border)',
      background: 'var(--panel-2)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--navy-50)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--panel-2)'}
  >
    <div style={{
      writingMode: 'vertical-rl', transform: 'rotate(180deg)',
      fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--text-3)',
      letterSpacing: 0.5, textTransform: 'uppercase',
    }}>‹ Mapping detail</div>
  </div>
);

/* ─── Collapsible table-binding strip ────────────────────────────── */

/* Generate the next available alias derived from a table name tail.
   Uses progressively longer prefixes; falls back to numeric suffixes. */
const genAlias = (tableName, existing) => {
  const tail = (tableName || '').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!tail) return 's' + (existing.length + 1);
  for (let n = 2; n <= Math.max(2, tail.length); n++) {
    const a = tail.slice(0, n);
    if (!existing.includes(a)) return a;
  }
  let n = 1;
  while (existing.includes(`${tail}${n}`)) n++;
  return `${tail}${n}`;
};

const JOIN_TYPES = ['LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'FULL JOIN'];

/* Composition mode toggle — flips a multi-source binding between JOIN and
   UNION. For single-source bindings (kind='single') the toggle still shows
   so the user can pre-select the mode that will apply when a 2nd source
   is added; the initial row's role is rewritten accordingly. */
const ModeToggle = ({ kind, sources, onChange, hasMultiple }) => {
  /* For 'single', infer the effective mode from the single source's role so
     the toggle reflects a preemptive UNION flip even before a 2nd source. */
  const effective = kind === 'union' ? 'union'
    : kind === 'join' ? 'join'
    : (sources?.[0]?.role === 'union' ? 'union' : 'join');
  return (
    <div style={{
      display: 'inline-flex',
      border: '1px solid var(--border-strong)', borderRadius: 3,
      overflow: 'hidden', marginLeft: 4,
    }}>
      {[
        { k: 'join',  l: '⋈ JOIN',  tip: 'Primary + secondary tables, matched on keys' },
        { k: 'union', l: '∪ UNION', tip: 'Stack multiple tables as one (same shape)' },
      ].map(opt => {
        const active = effective === opt.k;
        return (
          <button key={opt.k}
            onClick={() => { if (!active) onChange(opt.k); }}
            title={opt.tip + (hasMultiple ? '' : ' · applies when a 2nd source is added')}
            style={{
              padding: '2px 9px', border: 'none',
              background: active ? 'var(--navy-50)' : 'var(--panel)',
              color: active ? 'var(--navy)' : 'var(--text-2)',
              fontWeight: active ? 600 : 500,
              fontSize: 10.5, fontFamily: 'var(--mono)',
              letterSpacing: 0.3, textTransform: 'none',
              cursor: active ? 'default' : 'pointer',
            }}>
            {opt.l}
          </button>
        );
      })}
    </div>
  );
};

const CollapsibleBinding = ({ composition, tgtTable, internalName, hasAsis, open, onToggle, asisInventory, updateBinding }) => {
  const kind = composition?.kind || 'single';
  const op = kind === 'union' ? '∪' : kind === 'join' ? '⋈' : '';
  const sources = composition?.sources || [];
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [editingOnIdx, setEditingOnIdx] = React.useState(-1);
  const [onDraft, setOnDraft] = React.useState('');

  const pickerRef = React.useRef();
  React.useEffect(() => {
    if (!pickerOpen) return;
    const close = (e) => { if (!pickerRef.current?.contains(e.target)) setPickerOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setPickerOpen(false); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [pickerOpen]);

  const existingTables = sources.map(s => s.table);
  const addable = (asisInventory || []).filter(t => !existingTables.includes(t.name));

  /* Ensure there's a primary entry before appending joins — transitions a
     single-source binding into a multi-source join composition. */
  const withPrimary = (srcs) => {
    if (srcs.length > 0) return srcs;
    /* Fabricate a primary from the SCHEMA_DIFF asis label */
    const sd = (window.SCHEMA_DIFF || []).find(s => s.table === internalName);
    if (!sd || !sd.asis) return srcs;
    return [{ alias: genAlias(sd.asis, []), table: sd.asis, role: 'primary' }];
  };

  const addSource = (tbl) => {
    updateBinding(internalName, (srcs) => {
      const base = withPrimary(srcs);
      const aliases = base.map(s => s.alias);
      const newAlias = genAlias(tbl.name, aliases);
      const newSrc = base[0]?.role === 'union'
        ? { alias: newAlias, table: tbl.name, role: 'union', rows: tbl.rows }
        : { alias: newAlias, table: tbl.name, role: 'join', joinType: 'LEFT JOIN',
            joinOn: `${base[0].alias}.? = ${newAlias}.?`, rows: tbl.rows };
      return [...base, newSrc];
    });
    setPickerOpen(false);
  };

  const removeSource = (idx) => {
    updateBinding(internalName, (srcs) => srcs.filter((_, i) => i !== idx));
  };

  const changeJoinType = (idx, jt) => {
    updateBinding(internalName, (srcs) => srcs.map((s, i) => i === idx ? { ...s, joinType: jt } : s));
  };

  const commitOn = (idx) => {
    updateBinding(internalName, (srcs) => srcs.map((s, i) => i === idx ? { ...s, joinOn: onDraft } : s));
    setEditingOnIdx(-1);
  };

  /* Flip the composition kind between JOIN and UNION. All existing source
     entries are rewritten: in UNION all rows are role=union; in JOIN the
     first is primary and the rest are joins with default LEFT JOIN + an
     empty-ish ON template that the user can edit. */
  const changeMode = (newKind) => {
    updateBinding(internalName, (srcs) => {
      if (newKind === 'union') {
        /* Preserve joinType/joinOn so switching back to JOIN keeps edits. */
        return srcs.map(s => ({
          alias: s.alias, table: s.table, role: 'union', rows: s.rows,
          joinType: s.joinType, joinOn: s.joinOn,
        }));
      }
      /* join */
      return srcs.map((s, i) => i === 0
        ? { alias: s.alias, table: s.table, role: 'primary', rows: s.rows }
        : {
            alias: s.alias, table: s.table, role: 'join', rows: s.rows,
            joinType: s.joinType || 'LEFT JOIN',
            joinOn: s.joinOn || `${srcs[0].alias}.? = ${s.alias}.?`,
          });
    });
  };

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel-2)' }}>
      {/* Header (always visible) */}
      <div
        onClick={onToggle}
        style={{
          padding: '7px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--panel)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ color: 'var(--text-4)', fontSize: 10, width: 10 }}>{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
          Table binding
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11.5, minWidth: 0, flex: 1 }}>
          {composition?.kind === 'single' ? (
            <>
              <span style={{ color: 'var(--text)' }}>{composition.label}</span>
              <span style={{ color: 'var(--text-4)' }}><Ic.arrow/></span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{tgtTable}</span>
            </>
          ) : (
            <>
              {sources.map((s, i) => (
                <React.Fragment key={s.alias}>
                  {i > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 700 }}>{op}</span>}
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, color: 'var(--navy)',
                    background: '#fff', padding: '0 4px', borderRadius: 2,
                    border: '1px solid #c5d3e4',
                  }}>{s.alias}</span>
                  <span style={{ color: 'var(--text)' }}>{s.table.split('.').pop()}</span>
                </React.Fragment>
              ))}
              <span style={{ color: 'var(--text-4)' }}><Ic.arrow/></span>
              <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{tgtTable}</span>
            </>
          )}
        </div>
        {composition && composition.kind !== 'single' && (
          <StatusBadge tone="info">
            {kind === 'union' ? `UNION · ${sources.length}` : `JOIN · ${sources.length}`}
          </StatusBadge>
        )}
      </div>

      {/* Expanded editor */}
      {open && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px dashed var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7,
            position: 'relative',
          }}>
            <span>AS-IS source tables</span>
            {sources.length >= 1 && (
              <ModeToggle
                kind={kind}
                sources={sources}
                onChange={changeMode}
                hasMultiple={sources.length >= 2}
              />
            )}
            <div style={{ flex: 1 }}/>
            <div style={{ position: 'relative' }} ref={pickerRef}>
              <Btn kind="ghost" size="sm" icon={<Ic.plus/>}
                disabled={!hasAsis || addable.length === 0}
                onClick={(e) => { e.stopPropagation(); setPickerOpen(o => !o); }}>
                Add source
              </Btn>
              {pickerOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 4,
                    width: 300, maxHeight: 280, overflow: 'auto',
                    background: 'var(--panel)', border: '1px solid var(--border-strong)',
                    borderRadius: 4, boxShadow: '0 8px 24px rgba(20,30,50,.14)',
                    zIndex: 50, padding: '4px 0', textTransform: 'none', letterSpacing: 0,
                  }}>
                  <div style={{ padding: '4px 10px 4px', fontSize: 10, color: 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'var(--mono)' }}>
                    Pick an AS-IS table to {sources.length === 0 ? 'bind as primary' : (kind === 'union' ? 'add to UNION' : 'add as JOIN')}
                  </div>
                  {addable.length === 0 && (
                    <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-3)' }}>
                      (모든 AS-IS 테이블이 이미 추가됨)
                    </div>
                  )}
                  {addable.map(t => (
                    <button key={t.name}
                      onClick={() => addSource(t)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '4px 10px', border: 'none', background: 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      <span style={{ color: 'var(--text-4)', fontSize: 10 }}>
                        {t.columnCount != null ? `${t.columnCount}c` : ''}
                        {t.rows != null ? ` · ${t.rows >= 1e6 ? (t.rows / 1e6).toFixed(1) + 'M' : t.rows.toLocaleString()}` : ''}
                      </span>
                      {t.unrouted && <span style={{
                        fontSize: 9, padding: '0 4px', borderRadius: 2,
                        background: 'var(--amber-50)', color: 'var(--amber)',
                        border: '1px solid #ebcf8e', fontWeight: 600,
                      }}>unrouted</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!hasAsis && (
            <div style={{
              padding: 10, borderRadius: 3,
              border: '1px dashed #e4c793', background: '#fffaf0',
              fontSize: 11, color: '#7a4d05',
            }}>
              AS-IS DDL을 먼저 import 해야 소스 테이블을 연결할 수 있습니다.
            </div>
          )}

          {hasAsis && sources.length === 0 && (
            <div style={{
              padding: 10, borderRadius: 3,
              border: '1px dashed var(--border-strong)', background: 'var(--panel)',
              fontSize: 11, color: 'var(--text-3)',
            }}>
              이 TO-BE 테이블에 연결된 AS-IS 소스가 없습니다. [Add source] 로 추가하세요.
            </div>
          )}

          {hasAsis && sources.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sources.map((s, i) => {
                const isEditingOn = editingOnIdx === i;
                return (
                  <div key={s.alias + i} style={{
                    display: 'flex', flexDirection: 'column', gap: 4,
                    padding: '6px 10px',
                    border: `1px solid ${s.role === 'primary' ? 'var(--navy)' : 'var(--border)'}`,
                    background: s.role === 'primary' ? 'var(--navy-50)' : 'var(--panel)',
                    borderRadius: 3,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--navy)',
                        background: '#fff', padding: '1px 5px', borderRadius: 2,
                        border: '1px solid #c5d3e4', fontFamily: 'var(--mono)',
                      }}>{s.alias}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>{s.table}</span>
                      {s.rows != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)' }}>
                        {s.rows >= 1e6 ? (s.rows / 1e6).toFixed(1) + 'M' : s.rows.toLocaleString()} rows
                      </span>}
                      <div style={{ flex: 1 }}/>
                      {s.role === 'primary' && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--navy)', fontWeight: 600 }}>primary</span>
                      )}
                      {s.role === 'union' && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-2)', fontWeight: 600 }}>UNION</span>
                      )}
                      {s.role === 'join' && (
                        <select value={s.joinType || 'LEFT JOIN'} onChange={e => changeJoinType(i, e.target.value)}
                          style={{
                            height: 22, padding: '0 6px',
                            border: '1px solid var(--border-strong)', borderRadius: 3,
                            background: 'var(--panel)', fontSize: 11, fontFamily: 'var(--mono)',
                            color: 'var(--text-2)', cursor: 'pointer',
                          }}>
                          {JOIN_TYPES.map(jt => <option key={jt} value={jt}>{jt}</option>)}
                        </select>
                      )}
                      {s.role !== 'primary' ? (
                        <button onClick={() => removeSource(i)} title="remove this source"
                          style={{
                            border: 'none', background: 'transparent', color: 'var(--red)',
                            cursor: 'pointer', fontSize: 16, lineHeight: 1,
                            padding: '0 6px', borderRadius: 2,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--red-50)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >×</button>
                      ) : (
                        <span style={{ width: 22 }}/>
                      )}
                    </div>

                    {s.role === 'join' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 8px', marginLeft: 20,
                        border: '1px dashed var(--border)', borderRadius: 3,
                        background: 'var(--panel-2)',
                        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)',
                      }}>
                        <span style={{ color: 'var(--text-4)' }}>ON</span>
                        {isEditingOn ? (
                          <input
                            autoFocus
                            value={onDraft}
                            onChange={e => setOnDraft(e.target.value)}
                            onBlur={() => commitOn(i)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitOn(i);
                              if (e.key === 'Escape') setEditingOnIdx(-1);
                            }}
                            style={{
                              flex: 1, height: 20, padding: '0 6px',
                              border: '1px solid var(--navy)', borderRadius: 2,
                              fontFamily: 'var(--mono)', fontSize: 11,
                              background: '#fff', color: 'var(--text)',
                            }}/>
                        ) : (
                          <span
                            onClick={() => { setEditingOnIdx(i); setOnDraft(s.joinOn || ''); }}
                            title="click to edit"
                            style={{
                              flex: 1, cursor: 'text',
                              borderBottom: '1px dashed var(--border-strong)',
                              color: s.joinOn ? 'var(--text)' : 'var(--text-4)',
                              fontStyle: s.joinOn ? 'normal' : 'italic',
                            }}>
                            {s.joinOn || '(click to set)'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const sourceComposition = (sd) => {
  if (!sd) return null;
  /* Always normalize to an array with at least the primary. This lets the
     expanded binding editor render single-source bindings the same way as
     multi-source ones without special-casing. */
  const sources = (sd.sources && sd.sources.length > 0)
    ? sd.sources
    : (sd.asis ? [{ alias: genAlias(sd.asis, []), table: sd.asis, role: 'primary' }] : []);
  const kind = sources.length <= 1
    ? 'single'
    : (sources[0].role === 'union' ? 'union' : 'join');
  /* Label reflects the current composition, not the stale SCHEMA_DIFF.asis text. */
  const op = kind === 'union' ? ' ∪ ' : kind === 'join' ? ' ⋈ ' : '';
  const label = sources.length === 1 ? sources[0].table : sources.map(s => s.table).join(op);
  return { kind, sources, label };
};

const SourceAliasTag = ({ alias, composition }) => {
  if (!alias || !composition || composition.kind === 'single') return <span style={{ color: 'var(--text-4)', fontSize: 10 }}>—</span>;
  if (alias.includes('+')) {
    return (
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
        color: 'var(--text-2)', background: 'var(--gray-50)',
        border: '1px solid var(--border)', borderRadius: 2,
        padding: '1px 4px', whiteSpace: 'nowrap',
      }}>{alias}</span>
    );
  }
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
      color: 'var(--navy)', background: 'var(--navy-50)',
      border: '1px solid #c5d3e4', borderRadius: 2,
      padding: '1px 5px',
    }}>{alias}</span>
  );
};

/* ─── Inspector (unchanged from v1 save for sample preview wiring) ── */

const Inspector = ({ active, composition, onClose }) => {
  if (!active) return null;
  return (
    <aside style={{
      width: 340, minWidth: 340,
      borderLeft: '1px solid var(--border)',
      background: 'var(--panel)',
      display: 'flex', flexDirection: 'column',
      overflow: 'auto',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <button onClick={onClose} title="Hide detail" style={{
          position: 'absolute', top: 8, right: 10,
          border: 'none', background: 'transparent',
          color: 'var(--text-3)', cursor: 'pointer', padding: 4,
          display: 'inline-flex',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        ><Ic.x/></button>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Mapping detail</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>{active.src}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>→ {active.tgt}</div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
        <Row k="Source type">{active.srcType === '—' ? <span style={{ color: 'var(--text-4)' }}>—</span> : <TypeBadge>{active.srcType}</TypeBadge>}</Row>
        <Row k="Target type">{active.tgtType === '—' ? <span style={{ color: 'var(--text-4)' }}>—</span> : <TypeBadge>{active.tgtType}</TypeBadge>}</Row>
        <Row k="Rule"><RuleTag rule={active.rule}/></Row>
        {active.sourceAlias && <Row k="Source table"><SourceAliasTag alias={active.sourceAlias} composition={composition}/></Row>}
        <Row k="Primary key">{active.pk ? <StatusBadge tone="info">yes</StatusBadge> : <span style={{ color: 'var(--text-4)' }}>—</span>}</Row>
      </div>

      <TransformPanel active={active}/>

      {active.note && (
        <div style={{
          margin: '10px 14px 0', padding: 10,
          background: active.status === 'err' ? 'var(--red-50)' : active.status === 'warn' ? 'var(--amber-50)' : 'var(--gray-50)',
          border: `1px solid ${active.status === 'err' ? '#e5b2b2' : active.status === 'warn' ? '#ebcf8e' : 'var(--border)'}`,
          borderRadius: 4, fontSize: 11.5,
          color: active.status === 'err' ? '#8a2424' : active.status === 'warn' ? '#7a4d05' : 'var(--text-2)',
          fontFamily: 'var(--mono)', lineHeight: 1.5,
        }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.7, marginBottom: 4 }}>Note</div>
          {active.note}
        </div>
      )}

      <SamplePreview active={active}/>

      <div style={{ padding: '14px', marginTop: 'auto', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <Btn kind="secondary" size="sm">Edit rule</Btn>
        <div style={{ flex: 1 }}/>
        <Btn kind="ghost" size="sm" icon={<Ic.ext/>}>Docs</Btn>
      </div>
    </aside>
  );
};

const TransformPanel = ({ active }) => {
  const lines = buildTransformLines(active);
  return (
    <div style={{ padding: '10px 14px 6px', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span>Transform</span>
      </div>
      <div style={{
        padding: 10, background: '#0e1a2b', color: '#cad7e8',
        fontFamily: 'var(--mono)', fontSize: 11.5, borderRadius: 4, lineHeight: 1.5,
      }}>
        {lines.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }}/>)}
      </div>
    </div>
  );
};

const buildTransformLines = (r) => {
  const kw = (s) => `<span style="color:#e8b86f">${s}</span>`;
  const str = (s) => `<span style="color:#9fd9b3">${s}</span>`;
  const cmt = (s) => `<span style="color:#7a8aa6">${s}</span>`;
  const src = r.src;
  if (r.rule === 'skip') return [cmt('-- column is dropped from TO-BE'), `${kw('DROP')}(${src})`];
  if (r.rule === 'added') {
    if (r.note && r.note.startsWith('merge')) {
      return [cmt('-- merged from multiple source fields'), r.note];
    }
    return [cmt('-- no AS-IS source'), `${kw('DEFAULT')} ${str((r.note || '').replace(/^default = /, '') || 'NULL')}`];
  }
  if (r.srcType?.includes('YYYYMMDD')) {
    return [cmt('-- date parse'), `${kw('TO_DATE')}(${src}, ${str("'YYYYMMDD'")})`];
  }
  if (r.srcType?.includes('CHAR(14)') && r.tgtType?.includes('TIMESTAMP')) {
    return [
      cmt('-- timestamp parse with null guard'),
      `${kw('NULLIF')}(${src}, ${str("'00000000000000'")})`,
      `&nbsp;&nbsp;| ${kw('TO_TIMESTAMP')}(${str("'YYYYMMDDHH24MISS'")})`,
    ];
  }
  if (r.srcType?.includes('COMP-3')) {
    return [cmt('-- COMP-3 packed decimal → NUMERIC'), `${kw('unpack_comp3')}(${src})`];
  }
  if (r.srcType?.includes('EBCDIC-KANJI') || r.srcType?.includes('EBCDIC-KANA')) {
    const enc = r.srcType.includes('KANJI') ? 'ebcdic-kanji' : 'ebcdic-kana';
    return [
      cmt('-- iconv + codepoint guard'),
      `${kw('iconv')}(${str(`'${enc}'`)}, ${str("'utf-8'")}, ${src})`,
      `&nbsp;&nbsp;| ${kw('nfkc_normalize')}`,
    ];
  }
  if (r.srcType?.includes('EBCDIC')) {
    return [`${kw('iconv')}(${str("'ebcdic'")}, ${str("'utf-8'")}, ${src})`];
  }
  if (r.rule === 'rule') {
    return [cmt('-- cast / transform'), `${kw('CAST')}(${src} ${kw('AS')} ${r.tgtType})`];
  }
  return [cmt('-- direct pass-through'), `${src} ${kw('AS')} ${r.tgt}`];
};

const SamplePreview = ({ active }) => {
  const samples = React.useMemo(() => {
    if (!active || active.rule === 'skip') return null;
    const key = active.src;
    const bank = (window.SAMPLE_SOURCE_ROWS || {});
    const raw = bank[key] || bank._default || [];
    return raw.slice(0, 10).map(v => ({
      src: active.rule === 'added' ? '—' : v,
      out: active.rule === 'added'
        ? ((active.note || '').startsWith('default = ') ? (active.note || '').replace('default = ', '') : (active.note || '—'))
        : window.applyMockTransform(v, active),
    }));
  }, [active]);

  if (!samples) return null;

  return (
    <div style={{ padding: '10px 14px 6px', borderTop: '1px solid var(--border)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
        fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8,
      }}>
        <span>Sample preview</span>
        <span style={{
          padding: '0 5px', fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 600,
          background: 'var(--amber-50)', color: 'var(--amber)',
          border: '1px solid #ebcf8e', borderRadius: 2, textTransform: 'none', letterSpacing: 0,
        }}>mock</span>
      </div>

      <div style={{
        border: '1px solid var(--border)', borderRadius: 3,
        background: 'var(--panel-2)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          padding: '3px 8px', fontSize: 10, fontFamily: 'var(--mono)',
          color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5,
          background: 'var(--panel)', borderBottom: '1px solid var(--border)',
        }}>
          <span>Source ({active.src})</span>
          <span>Transformed ({active.tgt})</span>
        </div>
        {samples.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
            padding: '2px 8px',
            fontFamily: 'var(--mono)', fontSize: 11,
            background: i % 2 ? 'var(--panel-2)' : 'var(--panel)',
            borderBottom: i < samples.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.src}</span>
            <span style={{ color: row.out === 'NULL' ? 'var(--text-4)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.out}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 5, fontSize: 10, color: 'var(--text-4)',
        fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Ic.warn/>
        연결된 AS-IS가 없어 고정 샘플을 보여줍니다. 실접속 시 실제 10건으로 교체됩니다.
      </div>
    </div>
  );
};

/* ─── AS-IS table detail (read-only schema + routing info) ──────── */

const AsisTableDetail = ({ tableName, tobeInventory, updateBinding, bindingsVersion, hasTobe, onJumpToTobe }) => {
  /* Columns come from the canonical ASIS_COLUMN_SCHEMA (DDL parse result),
     independent of bindings. Routing and Maps-to info DO depend on current
     sd.sources and must re-compute when bindingsVersion bumps. */
  const columns = (window.ASIS_COLUMN_SCHEMA || {})[tableName] || [];

  const info = React.useMemo(() => {
    const diffs = window.SCHEMA_DIFF || [];
    const routing = [];
    const destByColumn = new Map(); // asisColName -> [{tobeTable, tobeCol, kind, internalName}]
    diffs.forEach(sd => {
      const sources = sd.sources || (sd.asis ? [{ table: sd.asis, alias: null, role: 'primary' }] : []);
      const src = sources.find(s => s.table === tableName);
      if (!src) return;
      routing.push({ to: sd.tobe, via: sd.table, role: src.role });
      sd.tobeCols.forEach(tc => {
        if (tc.renameFrom && columns.some(c => c.name === tc.renameFrom)) {
          const list = destByColumn.get(tc.renameFrom) || [];
          list.push({ tobeTable: sd.tobe, tobeCol: tc.name, kind: 'rename', internalName: sd.table });
          destByColumn.set(tc.renameFrom, list);
        }
        if (tc.mergedFrom) {
          tc.mergedFrom.forEach(mf => {
            if (columns.some(c => c.name === mf)) {
              const list = destByColumn.get(mf) || [];
              list.push({ tobeTable: sd.tobe, tobeCol: tc.name, kind: 'merge', internalName: sd.table });
              destByColumn.set(mf, list);
            }
          });
        }
      });
    });
    return { routing, destByColumn };
  }, [tableName, bindingsVersion, columns]);

  /* Route-to-TO-BE picker — inverse of Add source in CollapsibleBinding.
     Selecting a TO-BE appends this AS-IS as a source to that TO-BE's binding. */
  const [routingPickerOpen, setRoutingPickerOpen] = React.useState(false);
  const pickerRef = React.useRef();
  React.useEffect(() => {
    if (!routingPickerOpen) return;
    const close = (e) => { if (!pickerRef.current?.contains(e.target)) setRoutingPickerOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setRoutingPickerOpen(false); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [routingPickerOpen]);

  const currentRoutedInternals = new Set(info.routing.map(r => r.via));
  const routableTobe = (tobeInventory || []).filter(t => t.internalName);  // only SCHEMA_DIFF-backed targets can accept bindings

  const routeTo = (tobeItem) => {
    updateBinding?.(tobeItem.internalName, (srcs) => {
      const aliases = srcs.map(s => s.alias).filter(Boolean);
      const newAlias = genAlias(tableName, aliases);
      if (srcs.length === 0) {
        return [{ alias: newAlias, table: tableName, role: 'primary' }];
      }
      if (srcs.some(s => s.table === tableName)) return srcs; // already bound — no-op
      const isUnion = srcs[0].role === 'union';
      const newSrc = isUnion
        ? { alias: newAlias, table: tableName, role: 'union' }
        : {
            alias: newAlias, table: tableName, role: 'join',
            joinType: 'LEFT JOIN',
            joinOn: `${srcs[0].alias}.? = ${newAlias}.?`,
          };
      return [...srcs, newSrc];
    });
    setRoutingPickerOpen(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Context bar */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          fontSize: 9.5, fontFamily: 'var(--mono)', fontWeight: 700,
          color: '#b87219', background: '#fdf0de',
          border: '1px solid #e4c793', borderRadius: 2, padding: '1px 5px',
        }}>AS-IS</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{tableName}</span>
        <div style={{ flex: 1 }}/>
        <div style={{ position: 'relative' }} ref={pickerRef}>
          <Btn kind="secondary" size="sm" icon={<Ic.plus/>}
            disabled={!hasTobe || routableTobe.length === 0}
            onClick={(e) => { e.stopPropagation(); setRoutingPickerOpen(o => !o); }}>
            Route to TO-BE…
          </Btn>
          {routingPickerOpen && (
            <div onClick={e => e.stopPropagation()} style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 4,
              width: 340, maxHeight: 320, overflow: 'auto',
              background: 'var(--panel)', border: '1px solid var(--border-strong)',
              borderRadius: 4, boxShadow: '0 8px 24px rgba(20,30,50,.14)',
              zIndex: 50, padding: '4px 0',
            }}>
              <div style={{ padding: '4px 10px 4px', fontSize: 10, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'var(--mono)' }}>
                이 AS-IS 를 소스로 추가할 TO-BE 선택
              </div>
              {routableTobe.length === 0 && (
                <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-3)' }}>
                  (바인딩 가능한 TO-BE 테이블이 없음)
                </div>
              )}
              {routableTobe.map(t => {
                const alreadyBound = currentRoutedInternals.has(t.internalName);
                return (
                  <button key={t.name}
                    onClick={() => !alreadyBound && routeTo(t)}
                    disabled={alreadyBound}
                    title={alreadyBound ? '이미 이 AS-IS가 소스로 포함됨' : ''}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '5px 10px', border: 'none',
                      background: 'transparent',
                      cursor: alreadyBound ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--mono)', fontSize: 11.5,
                      color: alreadyBound ? 'var(--text-4)' : 'var(--text)',
                      opacity: alreadyBound ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!alreadyBound) e.currentTarget.style.background = 'var(--panel-2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span style={{ fontSize: 9.5, color: 'var(--text-4)' }}>
                      {t.compositionKind === 'none' ? 'empty'
                        : t.compositionKind === 'single' ? '← 1'
                        : t.compositionKind === 'join' ? `⋈ ${t.sources.length}`
                        : `∪ ${t.sources.length}`}
                    </span>
                    {alreadyBound && <span style={{
                      fontSize: 9, padding: '0 4px', borderRadius: 2,
                      background: 'var(--green-50)', color: 'var(--green)',
                      border: '1px solid #b7dcc0', fontWeight: 600,
                    }}>bound</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hint bar */}
      <div style={{
        padding: '6px 14px',
        background: '#fffaf0', borderBottom: '1px solid #f0e4cc',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 11, color: '#7a4d05',
      }}>
        <Ic.warn/>
        <span>
          이 화면은 <b>읽기 전용 브라우저</b>입니다. 컬럼 매핑 규칙을 편집하려면 오른쪽 <b>Maps to</b> 컬럼의 TO-BE 태그를 클릭하거나, 좌측 TO-BE 트리에서 대상 테이블을 선택하세요.
        </span>
      </div>

      {/* Routing summary */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--panel-2)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>
          Routing
        </div>
        {info.routing.length === 0 ? (
          <div style={{
            padding: 10, borderRadius: 3,
            border: '1px dashed #e4c793', background: '#fffaf0',
            fontSize: 11, color: '#7a4d05',
          }}>
            이 AS-IS 테이블은 아직 어느 TO-BE 테이블에도 연결되어 있지 않습니다.
            [Route to TO-BE…] 로 이행 대상을 지정하세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {info.routing.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px',
                border: '1px solid var(--border)', borderRadius: 3, background: 'var(--panel)',
                fontFamily: 'var(--mono)', fontSize: 11.5,
              }}>
                <span style={{ color: 'var(--text-2)' }}>{tableName.split('.').pop()}</span>
                <span style={{ color: 'var(--text-4)' }}><Ic.arrow/></span>
                <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{r.to}</span>
                <span style={{ flex: 1 }}/>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {r.role === 'primary' ? 'primary' : r.role === 'union' ? 'UNION' : 'JOIN'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Column list */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--panel)' }}>
        {columns.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
            컬럼 정보가 없습니다. DDL 파싱 결과를 확인하세요.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                {['', 'Column', 'Type', 'Nullable', 'PK', 'Maps to (TO-BE)'].map((h, i) => (
                  <th key={i} style={{
                    padding: '6px 10px', textAlign: 'left',
                    fontWeight: 500, fontSize: 11,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6,
                    background: 'var(--panel-2)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky', top: 0,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((c, i) => {
                const dests = info.destByColumn.get(c.name) || [];
                return (
                  <tr key={c.name} style={{
                    background: i % 2 === 1 ? 'var(--zebra)' : 'var(--panel)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      {c.pk && <span title="primary key" style={{ color: 'var(--navy)', display: 'inline-flex' }}><Ic.key/></span>}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text)' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '5px 10px' }}><TypeBadge>{c.type}</TypeBadge></td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      {c.nullable === false ? 'NO' : 'YES'}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      {c.pk ? '✓' : ''}
                    </td>
                    <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: 11 }}>
                      {dests.length === 0 ? (
                        <span style={{ color: 'var(--text-4)' }}>unmapped</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {dests.map((d, di) => (
                            <span key={di}
                              onClick={() => onJumpToTobe?.({ name: d.tobeTable, internalName: d.internalName })}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '1px 6px', borderRadius: 2,
                                background: d.kind === 'merge' ? 'var(--amber-50)' : 'var(--navy-50)',
                                border: `1px solid ${d.kind === 'merge' ? '#ebcf8e' : '#c5d3e4'}`,
                                color: d.kind === 'merge' ? '#8a5a06' : 'var(--navy)',
                                fontSize: 10.5, cursor: 'pointer',
                              }}
                              title={`Jump to ${d.tobeTable}.${d.tobeCol}`}>
                              {d.tobeTable.split('.').pop()}.{d.tobeCol}
                              {d.kind === 'merge' && <span style={{ fontSize: 9, opacity: 0.7 }}>(merge)</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ─── Empty states ──────────────────────────────────────────────── */

const GlobalEmpty = ({ project, which }) => {
  /* which = 'both' (no DDL at all) */
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{
        maxWidth: 520, padding: 28,
        border: '1px dashed var(--border-strong)', borderRadius: 6,
        background: 'var(--panel)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
          DDL not imported
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
          매핑을 시작하려면 AS-IS·TO-BE DDL을 먼저 가져와야 합니다
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>
          이 프로젝트는 아직 소스 스키마(AS-IS)와 대상 스키마(TO-BE) 정의가 없습니다.
          두 DDL 파일을 업로드하면 매핑 탭에서 테이블·컬럼을 탐색하고 연결을 만들 수 있습니다.
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14,
        }}>
          <div style={{
            padding: 12, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel-2)',
          }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>AS-IS schema</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#8a5a06' }}>not imported</div>
          </div>
          <div style={{
            padding: 12, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel-2)',
          }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>TO-BE schema</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: '#8a5a06' }}>not imported</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn kind="secondary" size="sm" icon={<Ic.download/>}>Settings › Source</Btn>
          <Btn kind="secondary" size="sm" icon={<Ic.download/>}>Settings › Target</Btn>
        </div>
      </div>
    </div>
  );
};

const GuidePanel = ({ hasAsis, hasTobe }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
    <div style={{ maxWidth: 420, textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
      좌측에서 테이블을 선택하세요.
      {hasAsis && hasTobe && <div style={{ marginTop: 6 }}>TO-BE 테이블을 선택하면 컬럼 매핑을 편집할 수 있고, AS-IS 테이블을 선택하면 스키마와 라우팅을 확인할 수 있습니다.</div>}
      {hasAsis && !hasTobe && <div style={{ marginTop: 6 }}>TO-BE DDL을 가져오면 매핑을 시작할 수 있습니다.</div>}
      {!hasAsis && hasTobe && <div style={{ marginTop: 6 }}>AS-IS DDL을 가져오면 소스 테이블을 연결할 수 있습니다.</div>}
    </div>
  </div>
);

const TobeBindingEmpty = ({ tableName }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
    <div style={{
      maxWidth: 460, padding: 22,
      border: '1px dashed var(--border-strong)', borderRadius: 6,
      background: 'var(--panel)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
        No source binding yet
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--mono)' }}>{tableName}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>
        이 TO-BE 테이블에 아직 AS-IS 소스가 지정되지 않았습니다.
        어느 AS-IS 테이블(들)에서 데이터를 가져올지 먼저 정의해야 컬럼 매핑을 시작할 수 있습니다.
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn kind="primary" size="sm" icon={<Ic.plus/>}
          onClick={() => alert('v1: AS-IS 인벤토리에서 소스 테이블을 고르는 피커가 뜹니다. 하나 고르면 primary로 잡히고, 추가 소스를 더해 JOIN/UNION 구성을 만들 수 있습니다.')}>
          Bind AS-IS source
        </Btn>
        <Btn kind="secondary" size="sm"
          onClick={() => alert('v1: TO-BE 테이블명과 유사한 AS-IS 테이블을 이름·타입 기반으로 자동 제안합니다.')}>
          Auto-suggest by name
        </Btn>
      </div>
    </div>
  </div>
);

const Row = ({ k, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 20 }}>
    <div style={{ width: 110, color: 'var(--text-3)', fontSize: 11.5 }}>{k}</div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

window.Mapping = Mapping;
