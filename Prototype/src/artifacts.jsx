/* Artifacts tab — schema diff viewer + DDL / SQL / YAML / validation
   + actual file downloads via Blob + <a download>.
*/

const xlsxTable = { width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--sans)' };
const xlsxCorner = { width: 32, background: '#f3f2f1', borderBottom: '1px solid #d0cfce', borderRight: '1px solid #d0cfce' };
const xlsxColHead = {
  padding: '2px 6px', background: '#f3f2f1', color: '#605e5c',
  borderBottom: '1px solid #d0cfce', borderRight: '1px solid #d0cfce',
  fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--mono)', minWidth: 72, textAlign: 'center',
};
const xlsxRowNum = {
  background: '#f3f2f1', color: '#605e5c', fontFamily: 'var(--mono)',
  borderRight: '1px solid #d0cfce', borderBottom: '1px solid #e1dfdd',
  fontSize: 10.5, padding: '2px 6px', textAlign: 'right', width: 32,
};
const xlsxCell = {
  padding: '3px 8px',
  borderRight: '1px solid #e1dfdd',
  borderBottom: '1px solid #e1dfdd',
  fontSize: 11, color: '#1a2330',
  whiteSpace: 'nowrap',
};
const xlsxHeaderCell = {
  ...xlsxCell,
  fontWeight: 600, background: '#edf4ee', color: '#1d4d2e',
};
const xlsxColHeadRow = (count) => (
  <tr>
    <th style={xlsxCorner}/>
    {Array.from({length: count}).map((_, i) => (
      <th key={i} style={xlsxColHead}>{String.fromCharCode(65 + i)}</th>
    ))}
  </tr>
);

/* ExcelWorkbook: reusable Excel-workbook chrome for artifact previews.
   title, cell (A1 value), formulaFx, sheets: [{name, render()}], onDownload */
const ExcelWorkbook = ({ filename, cellRef, formula, sheets, downloadLabel, onDownload, toolbar }) => {
  const [active, setActive] = React.useState(sheets[0].name);
  const activeSheet = sheets.find(s => s.name === active) || sheets[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--panel-2)', overflow: 'auto' }}>
      {toolbar}
      <div style={{ padding: '12px 14px', flex: '0 0 auto' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', background: '#fff',
          border: '1px solid var(--border)', borderRadius: 4,
          boxShadow: '0 2px 8px rgba(20,30,50,.04)', overflow: 'hidden',
        }}>
          {/* Title bar */}
          <div style={{
            padding: '7px 12px', background: '#217346', color: '#fff',
            fontSize: 11, fontFamily: 'var(--mono)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 16, height: 16, borderRadius: 2,
              background: '#fff', color: '#217346',
              display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 10,
            }}>X</span>
            <span>{filename}</span>
            <span style={{ color: 'rgba(255,255,255,.6)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,.7)' }}>read-only preview</span>
            <div style={{ flex: 1 }}/>
            {onDownload && (
              <button onClick={onDownload} style={{
                padding: '2px 10px', fontSize: 10.5, fontFamily: 'var(--mono)',
                background: 'rgba(255,255,255,.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,.3)', borderRadius: 3, cursor: 'pointer',
              }}>{downloadLabel || 'Download .xlsx'}</button>
            )}
          </div>
          {/* Ribbon */}
          <div style={{
            background: '#f3f2f1', borderBottom: '1px solid #d0cfce',
            padding: '4px 10px', fontSize: 10.5, color: '#605e5c',
            display: 'flex', gap: 12, fontFamily: 'var(--sans)',
          }}>
            {['File','Home','Insert','Page Layout','Formulas','Data','Review','View'].map((m, i) => (
              <span key={m} style={{
                padding: '3px 8px',
                background: i === 1 ? '#fff' : 'transparent',
                borderBottom: i === 1 ? '2px solid #217346' : 'none',
                color: i === 1 ? '#217346' : '#605e5c',
                whiteSpace: 'nowrap',
              }}>{m}</span>
            ))}
          </div>
          {/* Formula row */}
          <div style={{
            display: 'flex', alignItems: 'stretch',
            borderBottom: '1px solid #d0cfce', background: '#fff',
            fontFamily: 'var(--mono)', fontSize: 10.5,
          }}>
            <div style={{ padding: '3px 8px', width: 56, borderRight: '1px solid #d0cfce', color: '#605e5c' }}>{cellRef || 'A1'}</div>
            <div style={{ padding: '3px 8px', color: '#201f1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#605e5c' }}>fx  </span>
              {formula}
            </div>
          </div>
          {/* Sheet */}
          <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
            {activeSheet.render()}
          </div>
          {/* Sheet tabs */}
          <div style={{
            display: 'flex', borderTop: '1px solid #d0cfce',
            background: '#f3f2f1', overflowX: 'auto',
          }}>
            {sheets.map(s => (
              <button key={s.name} onClick={() => setActive(s.name)}
                style={{
                  padding: '4px 12px', border: 'none',
                  background: active === s.name ? '#fff' : 'transparent',
                  borderRight: '1px solid #d0cfce',
                  borderTop: active === s.name ? '2px solid #217346' : 'none',
                  marginTop: active === s.name ? -1 : 0,
                  color: active === s.name ? '#217346' : '#605e5c',
                  fontFamily: 'var(--sans)', fontSize: 11,
                  fontWeight: active === s.name ? 600 : 500,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{s.name}</button>
            ))}
            <div style={{ flex: 1 }}/>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 8 }}>
          rendered in-browser · actual file is a native .xlsx workbook
        </div>
      </div>
    </div>
  );
};

/* ─── diff computation ─────────────────────────────────────────── */

const computeDiff = (t) => {
  // Build lookup of ASIS by name
  const asisByName = Object.fromEntries(t.asisCols.map(c => [c.name, c]));
  const tobeByRename = {};
  t.tobeCols.forEach(c => { if (c.renameFrom) tobeByRename[c.renameFrom] = c; });

  const rows = [];

  // For each TOBE column: determine its status vs ASIS
  t.tobeCols.forEach(tc => {
    if (tc.added) {
      rows.push({ kind: 'added', tobe: tc, asis: null });
      return;
    }
    if (tc.renameFrom) {
      const ac = asisByName[tc.renameFrom];
      if (!ac) { rows.push({ kind: 'added', tobe: tc, asis: null }); return; }
      const typeChanged = normalizeType(ac.type) !== normalizeType(tc.type);
      rows.push({
        kind: typeChanged ? 'renamed+typed' : (tc.name !== ac.name ? 'renamed' : 'unchanged'),
        asis: ac,
        tobe: tc,
        confidence: tc.renameConfidence ?? 1,
      });
      return;
    }
    // same-name match
    const ac = asisByName[tc.name];
    if (ac) {
      const typeChanged = normalizeType(ac.type) !== normalizeType(tc.type);
      rows.push({ kind: typeChanged ? 'typed' : 'unchanged', asis: ac, tobe: tc, confidence: 1 });
    } else {
      rows.push({ kind: 'added', tobe: tc, asis: null });
    }
  });

  // ASIS columns that have no mapping in TOBE: removed
  const referenced = new Set();
  t.tobeCols.forEach(tc => {
    if (tc.renameFrom) referenced.add(tc.renameFrom);
    else if (asisByName[tc.name]) referenced.add(tc.name);
  });
  t.asisCols.forEach(ac => {
    if (!referenced.has(ac.name)) rows.push({ kind: 'removed', asis: ac, tobe: null });
  });

  return rows;
};

const normalizeType = (s) => s.replace(/\s+/g, '').toUpperCase();

/* ─── tokens ───────────────────────────────────────────────────── */

const KIND_STYLE = {
  added:          { sign: '+', bg: '#e8f5ec', bar: '#3e8f58', label: 'added',    text: '#1f5a33' },
  removed:        { sign: '−', bg: '#fceaea', bar: '#b84a4a', label: 'removed',  text: '#7b2525' },
  typed:          { sign: '~', bg: '#fff3db', bar: '#c08a2e', label: 'type',     text: '#7a5310' },
  renamed:        { sign: '→', bg: '#eef0f7', bar: '#6878a0', label: 'renamed',  text: '#3a4a70' },
  'renamed+typed':{ sign: '⇄', bg: '#fff0e8', bar: '#c96b3a', label: 'renamed+type', text: '#7a3812' },
  unchanged:      { sign: ' ', bg: 'transparent', bar: 'transparent', label: '', text: 'var(--text-3)' },
};

/* ─── file generators ──────────────────────────────────────────── */

const toPgType = (t) => {
  const s = t.toUpperCase();
  if (s.includes('COMP-3') || s.includes('NUMERIC')) return 'NUMERIC(15,2)';
  if (s.startsWith('CHAR(') && s.includes('YYYYMMDD')) return 'DATE';
  if (s.startsWith('CHAR(14)')) return 'TIMESTAMP';
  if (s.startsWith('CHAR(')) return 'VARCHAR' + s.slice(4).split(' ')[0];
  return t;
};

const genDDL = (t) => {
  const lines = [];
  lines.push(`-- DDL for ${t.tobe}`);
  lines.push(`-- generated from ${t.asis}`);
  lines.push(`DROP TABLE IF EXISTS ${t.tobe};`);
  lines.push(`CREATE TABLE ${t.tobe} (`);
  const cols = t.tobeCols.map(c => {
    const nn = c.nullable ? '' : ' NOT NULL';
    const def = c.default !== undefined ? ` DEFAULT ${c.default}` : '';
    return `  ${c.name.padEnd(22)} ${c.type}${nn}${def}`;
  });
  const pk = t.tobeCols.find(c => c.pk);
  if (pk) cols.push(`  PRIMARY KEY (${pk.name})`);
  lines.push(cols.join(',\n'));
  lines.push(`);`);
  return lines.join('\n');
};

const genMigrationSQL = (t) => {
  const lines = [];
  lines.push(`-- Migrate ${t.asis} → ${t.tobe}`);
  lines.push(`INSERT INTO ${t.tobe} (`);
  lines.push('  ' + t.tobeCols.map(c => c.name).join(',\n  '));
  lines.push(`)`);
  lines.push(`SELECT`);
  const selects = t.tobeCols.map(c => {
    if (c.added) return `  ${c.default ?? 'NULL'}  AS ${c.name}`;
    if (c.mergedFrom) return `  TO_TIMESTAMP(${c.mergedFrom[0]} || ${c.mergedFrom[1]}, 'YYYYMMDDHH24MISS')  AS ${c.name}`;
    const src = c.renameFrom || c.name;
    const srcCol = t.asisCols.find(a => a.name === src);
    if (!srcCol) return `  NULL  AS ${c.name}  -- !missing source`;
    // light cast hints
    if (srcCol.type.includes('YYYYMMDD')) return `  TO_DATE(${src}, 'YYYYMMDD')  AS ${c.name}`;
    if (srcCol.type.includes('COMP-3'))   return `  unpack_comp3(${src})  AS ${c.name}`;
    if (srcCol.type.includes('EBCDIC'))   return `  convert_from(${src}, 'EBCDIC-KANA')  AS ${c.name}`;
    return `  ${src}::${toPgType(c.type)}  AS ${c.name}`;
  });
  lines.push(selects.join(',\n'));
  lines.push(`FROM ${t.asis};`);
  return lines.join('\n');
};

const genMappingYAML = (t) => {
  const lines = [];
  lines.push(`table: ${t.table}`);
  lines.push(`source: ${t.asis}`);
  lines.push(`target: ${t.tobe}`);
  lines.push(`columns:`);
  t.tobeCols.forEach(c => {
    lines.push(`  - target: ${c.name}`);
    lines.push(`    type: ${c.type}`);
    if (c.pk) lines.push(`    primary_key: true`);
    if (c.added) {
      lines.push(`    action: add`);
      lines.push(`    default: ${c.default ?? 'NULL'}`);
    } else if (c.renameFrom) {
      lines.push(`    action: rename`);
      lines.push(`    source: ${c.renameFrom}`);
      if ((c.renameConfidence ?? 1) < 1) lines.push(`    confidence: ${c.renameConfidence}`);
    } else {
      lines.push(`    source: ${c.name}`);
    }
  });
  return lines.join('\n');
};

const genValidation = (t) => {
  const diff = computeDiff(t);
  const counts = diff.reduce((a, r) => ({ ...a, [r.kind]: (a[r.kind]||0)+1 }), {});
  return `# Validation report — ${t.table}
generated_at: 2026-04-21T09:41:03+09:00
source: ${t.asis}
target: ${t.tobe}

summary:
  asis_columns:  ${t.asisCols.length}
  tobe_columns:  ${t.tobeCols.length}
  added:         ${counts.added || 0}
  removed:       ${counts.removed || 0}
  type_changed:  ${counts.typed || 0}
  renamed:       ${(counts.renamed||0) + (counts['renamed+typed']||0)}

row_counts:
  asis: 18,442,331
  tobe: 18,442,331
  delta: 0
checksum:
  asis: sha256:8a2c..e109
  tobe: sha256:8a2c..e109
  match: true

low_confidence_renames:
${diff.filter(r => r.kind.startsWith('renamed') && (r.confidence ?? 1) < 0.85)
  .map(r => `  - ${r.asis.name} → ${r.tobe.name}  (confidence ${(r.confidence*100).toFixed(0)}%)`).join('\n') || '  (none)'}
`;
};

/* ─── download ─────────────────────────────────────────────────── */

const downloadBlob = (name, content, mime='text/plain') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

/* ─── UI ───────────────────────────────────────────────────────── */

const ArtifactTree = ({ tables, selected, onSelect, projectTables }) => {
  const [open, setOpen] = React.useState({ dashboard: true, diff: true, ddl: true, sql: false, yaml: false, validation: false });
  const cats = [
    { key: 'dashboard',  label: 'Dashboard snapshot', suffix: '.dashboard.xlsx', icon: '▣', single: true },
    { key: 'diff',       label: 'Schema diff',    suffix: '.diff.xlsx',  icon: '◨' },
    { key: 'ddl',        label: 'DDL scripts',    suffix: '.ddl.sql',    icon: '▤' },
    { key: 'sql',        label: 'Migration SQL',  suffix: '.migrate.sql',icon: '↦' },
    { key: 'yaml',       label: 'Mapping',        suffix: '.map.xlsx',   icon: '≡' },
    { key: 'validation', label: 'Validation',     suffix: '.report.xlsx',icon: '✓' },
  ];

  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 0' }}>
      {cats.map(cat => {
        const items = cat.single ? [{ table: '__project__' }] : tables;
        return (
        <div key={cat.key} style={{ marginBottom: 2 }}>
          <div
            onClick={() => setOpen(o => ({ ...o, [cat.key]: !o[cat.key] }))}
            style={{
              padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', color: 'var(--text-2)',
              fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
            <span style={{ display: 'inline-block', width: 8, color: 'var(--text-4)' }}>{open[cat.key] ? '▾' : '▸'}</span>
            <span>{cat.label}</span>
            <span style={{ color: 'var(--text-4)', marginLeft: 'auto' }}>{items.length}</span>
          </div>
          {open[cat.key] && items.map(t => {
            const active = selected.cat === cat.key && selected.table === t.table;
            const fname = cat.single ? `dashboard-snapshot${cat.suffix}` : `${t.table.toLowerCase()}${cat.suffix}`;
            return (
              <div key={t.table}
                onClick={() => onSelect({ cat: cat.key, table: t.table })}
                style={{
                  padding: '3px 10px 3px 28px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer',
                  background: active ? 'var(--navy-50)' : 'transparent',
                  color: active ? 'var(--navy)' : 'var(--text-2)',
                  fontWeight: active ? 600 : 400,
                  borderLeft: active ? '2px solid var(--navy)' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: 'var(--text-4)' }}>{cat.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fname}
                </span>
              </div>
            );
          })}
        </div>
      );})}
    </div>
  );
};

/* Schema diff — Excel workbook view */
const SchemaDiffView = ({ table }) => {
  const diff = computeDiff(table);
  const counts = diff.reduce((a, r) => ({ ...a, [r.kind]: (a[r.kind]||0)+1 }), {});
  const [defaults, setDefaults] = React.useState(
    Object.fromEntries(table.tobeCols.filter(c => c.added).map(c => [c.name, c.default ?? 'NULL']))
  );

  const fname = `${table.table.toLowerCase()}.diff.xlsx`;

  const toolbar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderBottom: '1px solid var(--border)',
      background: 'var(--panel)', flex: '0 0 auto',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600 }}>
        {table.asis} → {table.tobe}
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        <DiffPill kind="added"   n={counts.added}/>
        <DiffPill kind="removed" n={counts.removed}/>
        <DiffPill kind="typed"   n={counts.typed}/>
        <DiffPill kind="renamed" n={(counts.renamed||0) + (counts['renamed+typed']||0)}/>
        <span style={{ color: 'var(--text-4)' }}>·</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{diff.filter(r => r.kind === 'unchanged').length} unchanged</span>
      </div>
      <div style={{ flex: 1 }}/>
    </div>
  );

  const sheets = [
    {
      name: 'Diff',
      render: () => <DiffSheet diff={diff} defaults={defaults} setDefaults={setDefaults}/>,
    },
    {
      name: 'Summary',
      render: () => <DiffSummarySheet table={table} diff={diff} counts={counts}/>,
    },
    {
      name: 'ASIS',
      render: () => <ColumnListSheet cols={table.asisCols} side="asis"/>,
    },
    {
      name: 'TOBE',
      render: () => <ColumnListSheet cols={table.tobeCols} side="tobe"/>,
    },
  ];

  return (
    <ExcelWorkbook
      filename={fname}
      cellRef="A1"
      formula={`= "Schema diff · ${table.asis} → ${table.tobe}"`}
      sheets={sheets}
      onDownload={() => {
        const html = renderDiffAsHTML(table, diff, defaults);
        downloadBlob(fname, html, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }}
      toolbar={toolbar}
    />
  );
};

/* Excel-styled diff sheet — one row per diff entry with ASIS/TOBE columns */
const DiffSheet = ({ diff, defaults, setDefaults }) => {
  const headers = ['Status','ASIS column','ASIS type','ASIS null','TOBE column','TOBE type','TOBE null','Mapping / default','Confidence'];
  return (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(headers.length)}</thead>
      <tbody>
        <tr>
          <td style={xlsxRowNum}>1</td>
          {headers.map((h, i) => <td key={i} style={xlsxHeaderCell}>{h}</td>)}
        </tr>
        {diff.map((r, i) => {
          const s = KIND_STYLE[r.kind];
          const rowBg = r.kind === 'unchanged' ? '#fff' : s.bg;
          const label = r.kind === 'unchanged' ? 'unchanged' : s.label;
          const signStyle = {
            ...xlsxCell, textAlign: 'center', fontFamily: 'var(--mono)',
            fontWeight: 700, color: s.bar === 'transparent' ? '#9aa3b0' : s.bar,
            background: rowBg, borderLeft: s.bar !== 'transparent' ? `3px solid ${s.bar}` : undefined,
          };
          const lowConf = r.confidence !== undefined && r.confidence < 0.85;
          const mapping = r.kind === 'added'
            ? `default = ${defaults[r.tobe.name] ?? r.tobe.default ?? 'NULL'}`
            : r.kind === 'removed'
              ? 'DROP'
              : r.kind.startsWith('renamed')
                ? `${r.asis.name} → ${r.tobe.name}`
                : r.kind === 'typed'
                  ? `CAST(${r.asis.name} AS ${r.tobe.type})`
                  : '(direct)';
          const conf = r.confidence !== undefined ? `${Math.round(r.confidence*100)}%` : (r.kind === 'added' || r.kind === 'removed' ? '—' : '100%');
          return (
            <tr key={i}>
              <td style={xlsxRowNum}>{2 + i}</td>
              <td style={signStyle}>
                <span style={{ marginRight: 5 }}>{s.sign}</span>{label}
              </td>
              {/* ASIS */}
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', color: r.asis ? '#1a2330' : '#9aa3b0', fontStyle: r.asis ? 'normal' : 'italic'}}>
                {r.asis ? (<>{r.asis.pk && <span style={{ fontSize: 9, color: 'var(--navy)', marginRight: 4 }}>PK</span>}{r.asis.name}</>) : '—'}
              </td>
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>
                {r.asis?.type || '—'}
              </td>
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c', textAlign: 'center'}}>
                {r.asis ? (r.asis.nullable === false ? 'NO' : 'YES') : '—'}
              </td>
              {/* TOBE */}
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', color: r.tobe ? '#1a2330' : '#9aa3b0', fontStyle: r.tobe ? 'normal' : 'italic'}}>
                {r.tobe ? (<>{r.tobe.pk && <span style={{ fontSize: 9, color: 'var(--navy)', marginRight: 4 }}>PK</span>}{r.tobe.name}</>) : '—'}
              </td>
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>
                {r.tobe?.type || '—'}
              </td>
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c', textAlign: 'center'}}>
                {r.tobe ? (r.tobe.nullable === false ? 'NO' : 'YES') : '—'}
              </td>
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', fontSize: 10.5, color: s.text}}>
                {r.kind === 'added' ? (
                  <InlineDefaultEditor
                    value={defaults[r.tobe.name] ?? r.tobe.default ?? 'NULL'}
                    onChange={(v) => setDefaults(d => ({...d, [r.tobe.name]: v}))}
                  />
                ) : mapping}
              </td>
              <td style={{...xlsxCell, background: rowBg, fontFamily: 'var(--mono)', fontSize: 10.5, textAlign: 'right', color: lowConf ? '#b8631a' : '#605e5c', fontWeight: lowConf ? 600 : 400}}>
                {conf}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const InlineDefaultEditor = ({ value, onChange }) => {
  const [editing, setEditing] = React.useState(false);
  const [v, setV] = React.useState(value);
  const ref = React.useRef();
  React.useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);

  if (editing) {
    return (
      <input ref={ref}
        value={v} onChange={e => setV(e.target.value)}
        onBlur={() => { onChange(v); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onChange(v); setEditing(false); }
          if (e.key === 'Escape') { setV(value); setEditing(false); }
        }}
        style={{
          font: 'inherit', padding: '0 4px',
          border: '1.5px solid #217346', background: '#fff',
          color: '#1d4d2e', borderRadius: 0, width: 140,
        }}/>
    );
  }
  return (
    <span onClick={() => { setV(value); setEditing(true); }} title="click to edit default"
      style={{ cursor: 'text', borderBottom: '1px dashed #8fb59b', color: '#1f5a33' }}>
      default = {value}
    </span>
  );
};

const DiffSummarySheet = ({ table, diff, counts }) => {
  const kinds = ['added','removed','typed','renamed','renamed+typed','unchanged'];
  return (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(3)}</thead>
      <tbody>
        <tr><td style={xlsxRowNum}>1</td><td style={{...xlsxCell, fontSize: 14, fontWeight: 700, color: '#1d4d2e'}} colSpan="3">Schema diff summary</td></tr>
        <tr><td style={xlsxRowNum}>2</td><td style={xlsxCell} colSpan="3"/></tr>
        <tr><td style={xlsxRowNum}>3</td><td style={{...xlsxCell, fontWeight: 600}}>ASIS table</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="2">{table.asis}</td></tr>
        <tr><td style={xlsxRowNum}>4</td><td style={{...xlsxCell, fontWeight: 600}}>TOBE table</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="2">{table.tobe}</td></tr>
        <tr><td style={xlsxRowNum}>5</td><td style={{...xlsxCell, fontWeight: 600}}>ASIS columns</td><td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}} colSpan="2">{table.asisCols.length}</td></tr>
        <tr><td style={xlsxRowNum}>6</td><td style={{...xlsxCell, fontWeight: 600}}>TOBE columns</td><td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}} colSpan="2">{table.tobeCols.length}</td></tr>
        <tr><td style={xlsxRowNum}>7</td><td style={xlsxCell} colSpan="3"/></tr>
        <tr>
          <td style={xlsxRowNum}>8</td>
          <td style={xlsxHeaderCell}>Kind</td>
          <td style={xlsxHeaderCell}>Count</td>
          <td style={xlsxHeaderCell}>% of TOBE</td>
        </tr>
        {kinds.map((k, i) => {
          const s = KIND_STYLE[k];
          const n = counts[k] || 0;
          const pct = table.tobeCols.length ? ((n / table.tobeCols.length) * 100).toFixed(1) : '0.0';
          return (
            <tr key={k}>
              <td style={xlsxRowNum}>{9 + i}</td>
              <td style={{...xlsxCell, color: s.text, background: k === 'unchanged' ? '#fff' : s.bg, fontWeight: 600}}>
                <span style={{ fontFamily: 'var(--mono)', marginRight: 6 }}>{s.sign}</span>{k}
              </td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{n}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: '#605e5c'}}>{pct}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const ColumnListSheet = ({ cols, side }) => {
  const headers = side === 'asis'
    ? ['#','Column','Type','Nullable','PK']
    : ['#','Column','Type','Nullable','PK','Origin'];
  return (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(headers.length)}</thead>
      <tbody>
        <tr>
          <td style={xlsxRowNum}>1</td>
          {headers.map((h, i) => <td key={i} style={xlsxHeaderCell}>{h}</td>)}
        </tr>
        {cols.map((c, i) => (
          <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
            <td style={xlsxRowNum}>{2 + i}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', color: '#605e5c', textAlign: 'right'}}>{i + 1}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>
              {c.pk && <span style={{ fontSize: 9, color: 'var(--navy)', marginRight: 4 }}>PK</span>}
              {c.name}
            </td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{c.type}</td>
            <td style={{...xlsxCell, textAlign: 'center', fontSize: 10.5}}>{c.nullable === false ? 'NO' : 'YES'}</td>
            <td style={{...xlsxCell, textAlign: 'center'}}>{c.pk ? '✓' : ''}</td>
            {side === 'tobe' && (
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>
                {c.added ? `new · default=${c.default ?? 'NULL'}` : c.renameFrom ? `rename ← ${c.renameFrom}` : c.mergedFrom ? `merge(${c.mergedFrom.join('+')})` : '(direct)'}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// unused-but-kept legacy refs (keeps old vars referenced so nothing else breaks)
const _legacyShowUnchangedState = () => React.useState(true);

/* ============================================================= */
/* Mapping — Excel workbook                                        */
/* ============================================================= */

const MappingExcelView = ({ table }) => {
  const fname = `${table.table.toLowerCase()}.map.xlsx`;
  const transformOf = (c) => {
    if (c.added) return `<add> default = ${c.default ?? 'NULL'}`;
    if (c.mergedFrom) return `merge(${c.mergedFrom.join(' + ')}) → TIMESTAMP`;
    const src = c.renameFrom || c.name;
    const srcCol = table.asisCols.find(a => a.name === src);
    if (!srcCol) return '<missing source>';
    if (srcCol.type.includes('YYYYMMDD')) return `to_date(${src}, 'YYYYMMDD')`;
    if (srcCol.type.includes('YYYYMMDDHH')) return `to_timestamp(${src}, 'YYYYMMDDHH24MISS')`;
    if (srcCol.type.includes('COMP-3')) return `unpack_comp3(${src})`;
    if (srcCol.type.includes('EBCDIC-KANA')) return `iconv(${src}, 'EBCDIC-KANA' → 'UTF-8')`;
    if (srcCol.type.includes('EBCDIC')) return `iconv(${src}, 'EBCDIC' → 'UTF-8')`;
    return c.renameFrom ? `rename: ${c.renameFrom} → ${c.name}` : '(direct)';
  };
  const ruleKindOf = (c) => {
    if (c.added) return 'add';
    if (c.mergedFrom) return 'merge';
    if (c.renameFrom) return 'rename';
    const srcCol = table.asisCols.find(a => a.name === c.name);
    if (srcCol && srcCol.type !== c.type) return 'cast';
    return 'direct';
  };
  const ruleKindStyle = {
    add:    { bg: '#e8f5ec', fg: '#1e7a2f' },
    merge:  { bg: '#fff0e8', fg: '#7a3812' },
    rename: { bg: '#eef0f7', fg: '#3a4a70' },
    cast:   { bg: '#fff3db', fg: '#7a5310' },
    direct: { bg: '#fafafa', fg: '#605e5c' },
  };

  const rows = table.tobeCols.map(c => ({
    target: c.name,
    targetType: c.type,
    source: c.added ? '—' : c.mergedFrom ? c.mergedFrom.join(' + ') : (c.renameFrom || c.name),
    sourceType: (() => {
      if (c.added) return '—';
      if (c.mergedFrom) return 'multi';
      const a = table.asisCols.find(x => x.name === (c.renameFrom || c.name));
      return a?.type || '—';
    })(),
    kind: ruleKindOf(c),
    transform: transformOf(c),
    pk: c.pk,
    nullable: c.nullable !== false,
    confidence: c.renameConfidence ?? (c.added ? 1 : 1),
  }));

  const rulesSheet = () => (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(8)}</thead>
      <tbody>
        <tr>
          <td style={xlsxRowNum}>1</td>
          {['Source','Source type','Target','Target type','PK','Null','Rule','Transform'].map((h, i) => (
            <td key={i} style={xlsxHeaderCell}>{h}</td>
          ))}
        </tr>
        {rows.map((r, i) => {
          const ks = ruleKindStyle[r.kind];
          return (
            <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
              <td style={xlsxRowNum}>{2 + i}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>{r.source}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{r.sourceType}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>
                {r.pk && <span style={{ fontSize: 9, color: 'var(--navy)', marginRight: 4 }}>PK</span>}
                {r.target}
              </td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{r.targetType}</td>
              <td style={{...xlsxCell, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10.5}}>{r.pk ? '✓' : ''}</td>
              <td style={{...xlsxCell, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{r.nullable ? 'YES' : 'NO'}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, background: ks.bg, color: ks.fg, textAlign: 'center'}}>{r.kind}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#1a2330'}}>{r.transform}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const lookupSheet = () => {
    const fakeLookups = [
      ['status_dict', '0', 'closed'],
      ['status_dict', '1', 'active'],
      ['status_dict', '2', 'frozen'],
      ['status_dict', '9', 'pending_kyc'],
      ['branch_dict', '001', 'Tokyo Marunouchi'],
      ['branch_dict', '002', 'Osaka Umeda'],
      ['branch_dict', '003', 'Yokohama Minato'],
      ['branch_dict', '004', 'Nagoya Sakae'],
      ['acct_type', 'S', 'savings'],
      ['acct_type', 'C', 'checking'],
      ['acct_type', 'L', 'loan'],
    ];
    return (
      <table style={xlsxTable}>
        <thead>{xlsxColHeadRow(3)}</thead>
        <tbody>
          <tr>
            <td style={xlsxRowNum}>1</td>
            {['Lookup','Source value','Target value'].map((h, i) => <td key={i} style={xlsxHeaderCell}>{h}</td>)}
          </tr>
          {fakeLookups.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
              <td style={xlsxRowNum}>{2 + i}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontWeight: 500}}>{r[0]}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'center'}}>{r[1]}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const overviewSheet = () => (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(3)}</thead>
      <tbody>
        <tr><td style={xlsxRowNum}>1</td><td style={{...xlsxCell, fontSize: 14, fontWeight: 700, color: '#1d4d2e'}} colSpan="3">Mapping spec — {table.table}</td></tr>
        <tr><td style={xlsxRowNum}>2</td><td style={xlsxCell} colSpan="3"/></tr>
        <tr><td style={xlsxRowNum}>3</td><td style={{...xlsxCell, fontWeight: 600}}>Source</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="2">{table.asis}</td></tr>
        <tr><td style={xlsxRowNum}>4</td><td style={{...xlsxCell, fontWeight: 600}}>Target</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="2">{table.tobe}</td></tr>
        <tr><td style={xlsxRowNum}>5</td><td style={{...xlsxCell, fontWeight: 600}}>Generated</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="2">2026-04-21 09:41 JST</td></tr>
        <tr><td style={xlsxRowNum}>6</td><td style={{...xlsxCell, fontWeight: 600}}>Author</td><td style={{...xlsxCell}} colSpan="2">Henry Oh · KS Info System</td></tr>
        <tr><td style={xlsxRowNum}>7</td><td style={xlsxCell} colSpan="3"/></tr>
        <tr><td style={xlsxRowNum}>8</td><td style={xlsxHeaderCell}>Rule kind</td><td style={xlsxHeaderCell}>Count</td><td style={xlsxHeaderCell}>%</td></tr>
        {(() => {
          const tally = {};
          rows.forEach(r => { tally[r.kind] = (tally[r.kind]||0)+1; });
          return Object.entries(tally).map(([k, n], i) => {
            const ks = ruleKindStyle[k];
            return (
              <tr key={k}>
                <td style={xlsxRowNum}>{9 + i}</td>
                <td style={{...xlsxCell, background: ks.bg, color: ks.fg, fontWeight: 600, fontFamily: 'var(--mono)'}}>{k}</td>
                <td style={{...xlsxCell, textAlign: 'right', fontFamily: 'var(--mono)'}}>{n}</td>
                <td style={{...xlsxCell, textAlign: 'right', fontFamily: 'var(--mono)', color: '#605e5c'}}>{((n / rows.length) * 100).toFixed(1)}%</td>
              </tr>
            );
          });
        })()}
      </tbody>
    </table>
  );

  const sheets = [
    { name: 'Overview', render: overviewSheet },
    { name: 'Rules', render: rulesSheet },
    { name: 'Lookups', render: lookupSheet },
  ];

  return (
    <ExcelWorkbook
      filename={fname}
      cellRef="A1"
      formula={`= "Mapping spec · ${table.asis} → ${table.tobe} · ${rows.length} rules"`}
      sheets={sheets}
      onDownload={() => downloadBlob(fname, genMappingYAML(table), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    />
  );
};

/* ============================================================= */
/* Validation — Excel workbook (PK/FK/NULL/sum reconciliation)     */
/* ============================================================= */

const ValidationExcelView = ({ table }) => {
  const fname = `${table.table.toLowerCase()}.report.xlsx`;
  // Deterministic seeded numbers from table name
  const seed = [...table.table].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (k) => ((seed * 9301 + (k * 49297)) % 233280) / 233280;
  const baseRows = 18_442_331 + Math.floor(rng(1) * 5_000_000);
  const tobeRows = baseRows; // reconciled

  const numericCols = table.tobeCols.filter(c => c.type.startsWith('NUMERIC') || c.type === 'INTEGER' || c.type.startsWith('SMALLINT'));
  const textCols = table.tobeCols.filter(c => c.type.startsWith('VARCHAR') || c.type.startsWith('CHAR'));

  const sumChecks = numericCols.map((c, i) => {
    const sumA = Math.floor(rng(10 + i) * 1e12) + baseRows * 1342;
    const sumB = sumA;
    const delta = sumA ? ((sumB - sumA) / sumA) * 100 : 0;
    return {
      col: c.name, type: c.type,
      sumA: sumA.toLocaleString(),
      sumB: sumB.toLocaleString(),
      delta: delta.toFixed(6) + '%',
      pass: Math.abs(delta) < 0.001,
    };
  });

  const nullChecks = table.tobeCols.map((c, i) => {
    const ratio = c.nullable ? rng(20 + i) * 0.18 : 0;
    const nullsA = c.nullable ? Math.floor(baseRows * ratio) : 0;
    const nullsB = nullsA;
    return {
      col: c.name, type: c.type,
      nullable: c.nullable !== false,
      nullsA: nullsA.toLocaleString(),
      nullsB: nullsB.toLocaleString(),
      delta: nullsA - nullsB,
      pass: nullsA === nullsB,
    };
  });

  const overflowChecks = numericCols.map((c, i) => {
    const m = c.type.match(/NUMERIC\((\d+),\s*(\d+)\)/);
    const precision = m ? +m[1] : 18;
    const max = '9'.repeat(precision - 2);
    const overflow = i === 0 && rng(30) > 0.7 ? Math.floor(rng(31) * 4) : 0;
    return {
      col: c.name, type: c.type,
      bound: `±${max}`,
      observed: '8.21e+9',
      overflow,
      pass: overflow === 0,
    };
  });

  const overviewSheet = () => {
    const total = sumChecks.length + nullChecks.length + overflowChecks.length + 2;
    const fail = sumChecks.filter(x => !x.pass).length + nullChecks.filter(x => !x.pass).length + overflowChecks.filter(x => !x.pass).length;
    const pass = total - fail;
    return (
      <table style={xlsxTable}>
        <thead>{xlsxColHeadRow(4)}</thead>
        <tbody>
          <tr><td style={xlsxRowNum}>1</td><td style={{...xlsxCell, fontSize: 14, fontWeight: 700, color: '#1d4d2e'}} colSpan="4">Validation report — {table.table}</td></tr>
          <tr><td style={xlsxRowNum}>2</td><td style={xlsxCell} colSpan="4"/></tr>
          <tr><td style={xlsxRowNum}>3</td><td style={{...xlsxCell, fontWeight: 600}}>ASIS table</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="3">{table.asis}</td></tr>
          <tr><td style={xlsxRowNum}>4</td><td style={{...xlsxCell, fontWeight: 600}}>TOBE table</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="3">{table.tobe}</td></tr>
          <tr><td style={xlsxRowNum}>5</td><td style={{...xlsxCell, fontWeight: 600}}>Generated</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="3">2026-04-21 09:41 JST</td></tr>
          <tr><td style={xlsxRowNum}>6</td><td style={xlsxCell} colSpan="4"/></tr>
          <tr>
            <td style={xlsxRowNum}>7</td>
            {['Check','ASIS','TOBE','Verdict'].map(h => <td key={h} style={xlsxHeaderCell}>{h}</td>)}
          </tr>
          {[
            ['Row count', baseRows.toLocaleString(), tobeRows.toLocaleString(), baseRows === tobeRows],
            ['SHA-256 checksum', 'sha256:8a2c…e109', 'sha256:8a2c…e109', true],
            [`Sum reconciliation (${sumChecks.length} cols)`, '—', '—', sumChecks.every(x => x.pass)],
            [`NULL count parity (${nullChecks.length} cols)`, '—', '—', nullChecks.every(x => x.pass)],
            [`Range/overflow (${overflowChecks.length} cols)`, '—', '—', overflowChecks.every(x => x.pass)],
          ].map((r, i) => (
            <tr key={i}>
              <td style={xlsxRowNum}>{8 + i}</td>
              <td style={xlsxCell}>{r[0]}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, textAlign: 'right'}}>{r[1]}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, textAlign: 'right'}}>{r[2]}</td>
              <td style={{
                ...xlsxCell, fontWeight: 600,
                color: r[3] ? '#1e7a2f' : '#a12929',
                background: r[3] ? '#e8f5ec' : '#fbeaea',
                textAlign: 'center',
              }}>{r[3] ? '✓ PASS' : '✗ FAIL'}</td>
            </tr>
          ))}
          <tr><td style={xlsxRowNum}>{8 + 5}</td><td style={xlsxCell} colSpan="4"/></tr>
          <tr>
            <td style={xlsxRowNum}>{8 + 6}</td>
            <td style={{...xlsxCell, fontWeight: 600}}>Total</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{total}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: '#1e7a2f'}}>{pass} pass</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: fail ? '#a12929' : '#605e5c'}}>{fail} fail</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const sumSheet = () => (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(6)}</thead>
      <tbody>
        <tr>
          <td style={xlsxRowNum}>1</td>
          {['Column','Type','SUM(ASIS)','SUM(TOBE)','Δ %','Verdict'].map(h => <td key={h} style={xlsxHeaderCell}>{h}</td>)}
        </tr>
        {sumChecks.length === 0 && (
          <tr><td style={xlsxRowNum}>2</td><td style={xlsxCell} colSpan="6">no numeric columns</td></tr>
        )}
        {sumChecks.map((r, i) => (
          <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
            <td style={xlsxRowNum}>{2 + i}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>{r.col}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{r.type}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{r.sumA}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{r.sumB}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: r.pass ? '#1e7a2f' : '#a12929'}}>{r.delta}</td>
            <td style={{
              ...xlsxCell, fontWeight: 600, textAlign: 'center',
              color: r.pass ? '#1e7a2f' : '#a12929',
              background: r.pass ? '#e8f5ec' : '#fbeaea',
            }}>{r.pass ? '✓ PASS' : '✗ FAIL'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const nullSheet = () => (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(7)}</thead>
      <tbody>
        <tr>
          <td style={xlsxRowNum}>1</td>
          {['Column','Type','Nullable','NULLs ASIS','NULLs TOBE','Δ','Verdict'].map(h => <td key={h} style={xlsxHeaderCell}>{h}</td>)}
        </tr>
        {nullChecks.map((r, i) => (
          <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
            <td style={xlsxRowNum}>{2 + i}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>{r.col}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{r.type}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, textAlign: 'center'}}>{r.nullable ? 'YES' : 'NO'}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{r.nullsA}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{r.nullsB}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: r.pass ? '#605e5c' : '#a12929'}}>{r.delta >= 0 ? '+' : ''}{r.delta}</td>
            <td style={{
              ...xlsxCell, fontWeight: 600, textAlign: 'center',
              color: r.pass ? '#1e7a2f' : '#a12929',
              background: r.pass ? '#e8f5ec' : '#fbeaea',
            }}>{r.pass ? '✓' : '✗'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const rangeSheet = () => (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(6)}</thead>
      <tbody>
        <tr>
          <td style={xlsxRowNum}>1</td>
          {['Column','Type','Bound','Observed max','Overflow rows','Verdict'].map(h => <td key={h} style={xlsxHeaderCell}>{h}</td>)}
        </tr>
        {overflowChecks.length === 0 && (
          <tr><td style={xlsxRowNum}>2</td><td style={xlsxCell} colSpan="6">no numeric columns to range-check</td></tr>
        )}
        {overflowChecks.map((r, i) => (
          <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
            <td style={xlsxRowNum}>{2 + i}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>{r.col}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{r.type}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{r.bound}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{r.observed}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: r.overflow ? '#a12929' : '#605e5c'}}>{r.overflow}</td>
            <td style={{
              ...xlsxCell, fontWeight: 600, textAlign: 'center',
              color: r.pass ? '#1e7a2f' : '#a12929',
              background: r.pass ? '#e8f5ec' : '#fbeaea',
            }}>{r.pass ? '✓' : '✗'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const sheets = [
    { name: 'Overview', render: overviewSheet },
    { name: 'Sum recon', render: sumSheet },
    { name: 'NULL parity', render: nullSheet },
    { name: 'Range', render: rangeSheet },
  ];

  return (
    <ExcelWorkbook
      filename={fname}
      cellRef="A1"
      formula={`= "Validation report · ${table.table} · 5 checks"`}
      sheets={sheets}
      onDownload={() => downloadBlob(fname, genValidation(table), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    />
  );
};

const DiffPill = ({ kind, n }) => {
  if (!n) return null;
  const s = KIND_STYLE[kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '0 6px', borderRadius: 2,
      background: s.bg, color: s.text,
      fontSize: 10, fontFamily: 'var(--mono)',
    }}>
      <span style={{ fontWeight: 700 }}>{s.sign}</span>
      <span>{n} {s.label}</span>
    </span>
  );
};

const DiffRow = ({ row, defaults, editing, onEditDefault, onSaveDefault, onCancelEdit }) => {
  const s = KIND_STYLE[row.kind];
  const lowConf = row.confidence !== undefined && row.confidence < 0.85;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 1fr 1fr',
      borderBottom: '1px solid var(--border-soft, #eef0f4)',
      background: row.kind === 'unchanged' ? 'transparent' : s.bg,
      minHeight: 28,
    }}>
      {/* marker */}
      <div style={{
        padding: '5px 0',
        textAlign: 'center',
        fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12,
        color: row.kind === 'unchanged' ? 'var(--text-4)' : s.bar,
        borderRight: `3px solid ${s.bar}`,
        background: s.bar === 'transparent' ? 'transparent' : 'rgba(255,255,255,0.4)',
      }}>
        {s.sign}
      </div>

      {/* ASIS side */}
      <div style={{
        padding: '5px 10px',
        borderRight: '1px solid var(--border)',
        opacity: row.kind === 'added' ? 0.25 : 1,
        fontFamily: 'var(--mono)', fontSize: 11.5,
      }}>
        {row.asis ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500, color: row.kind === 'removed' ? '#7b2525' : 'var(--text)' }}>
              {row.asis.pk && <span style={{ fontSize: 9, color: 'var(--navy)', marginRight: 4 }}>PK</span>}
              {row.asis.name}
            </span>
            <span style={{ color: 'var(--text-3)', fontSize: 10.5 }}>{row.asis.type}</span>
            {row.asis.nullable === false && row.kind !== 'removed' &&
              <span style={{ fontSize: 9, color: 'var(--text-4)' }}>NOT NULL</span>}
            {row.kind === 'removed' &&
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7b2525', fontFamily: 'var(--sans)' }}>dropped</span>}
          </div>
        ) : (
          <span style={{ color: 'var(--text-4)', fontFamily: 'var(--sans)', fontSize: 10.5, fontStyle: 'italic' }}>
            — no equivalent —
          </span>
        )}
      </div>

      {/* TOBE side */}
      <div style={{
        padding: '5px 10px',
        opacity: row.kind === 'removed' ? 0.25 : 1,
        fontFamily: 'var(--mono)', fontSize: 11.5,
      }}>
        {row.tobe ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 500, color: row.kind === 'added' ? '#1f5a33' : 'var(--text)' }}>
              {row.tobe.pk && <span style={{ fontSize: 9, color: 'var(--navy)', marginRight: 4 }}>PK</span>}
              {row.tobe.name}
            </span>
            <span style={{ color: 'var(--text-3)', fontSize: 10.5 }}>{row.tobe.type}</span>
            {row.tobe.nullable === false && <span style={{ fontSize: 9, color: 'var(--text-4)' }}>NOT NULL</span>}

            {row.kind === 'added' && (
              editing ? (
                <DefaultEditor
                  initial={defaults[row.tobe.name] ?? row.tobe.default}
                  onSave={onSaveDefault} onCancel={onCancelEdit}
                />
              ) : (
                <span
                  onClick={onEditDefault}
                  title="click to edit default"
                  style={{
                    fontSize: 10.5, padding: '1px 5px',
                    background: '#fff', border: '1px dashed #8fb59b',
                    borderRadius: 2, cursor: 'text',
                    color: '#1f5a33',
                  }}>
                  default = {defaults[row.tobe.name] ?? row.tobe.default ?? 'NULL'}
                </span>
              )
            )}

            {row.kind.startsWith('renamed') && (
              <span style={{
                fontSize: 10, padding: '1px 5px', borderRadius: 2,
                background: '#fff', border: '1px solid #c5cbde', color: '#3a4a70',
              }}>
                ← {row.asis.name}
                {lowConf && (
                  <span style={{ color: '#b8631a', fontWeight: 600, marginLeft: 5 }}>
                    ?{Math.round(row.confidence*100)}%
                  </span>
                )}
              </span>
            )}

            {(row.kind === 'typed' || row.kind === 'renamed+typed') && (
              <span style={{
                fontSize: 10, padding: '1px 5px', borderRadius: 2,
                background: '#fff', border: '1px solid #d9c59a', color: '#7a5310',
              }}>
                type: {row.asis.type} → {row.tobe.type}
              </span>
            )}
            {row.tobe.mergedFrom && (
              <span style={{
                fontSize: 10, padding: '1px 5px', borderRadius: 2,
                background: '#fff', border: '1px solid #c5cbde', color: '#3a4a70',
              }}>
                merged ← {row.tobe.mergedFrom.join(' + ')}
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-4)', fontFamily: 'var(--sans)', fontSize: 10.5, fontStyle: 'italic' }}>
            — removed —
          </span>
        )}
      </div>
    </div>
  );
};

const DefaultEditor = ({ initial, onSave, onCancel }) => {
  const [v, setV] = React.useState(initial ?? '');
  const ref = React.useRef();
  React.useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10.5, color: '#1f5a33' }}>default =</span>
      <input ref={ref}
        value={v} onChange={e => setV(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(v);
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => onSave(v)}
        style={{
          fontFamily: 'var(--mono)', fontSize: 10.5,
          padding: '1px 5px', border: '1px solid var(--navy)', borderRadius: 2,
          width: 120, outline: 'none',
        }}/>
    </span>
  );
};

/* Standalone HTML renderer for diff download */
const renderDiffAsHTML = (table, diff, defaults) => {
  const rowHtml = diff.map(r => {
    const s = KIND_STYLE[r.kind];
    const def = r.tobe && r.tobe.added ? (defaults[r.tobe.name] ?? r.tobe.default ?? 'NULL') : '';
    const asis = r.asis ? `<b>${r.asis.name}</b> <span style="color:#68778f">${r.asis.type}</span>` : '—';
    const tobe = r.tobe ? `<b>${r.tobe.name}</b> <span style="color:#68778f">${r.tobe.type}</span>${def ? ` <em style="color:#1f5a33">default=${def}</em>` : ''}` : '—';
    return `<tr style="background:${s.bg};"><td style="width:24px;text-align:center;font-weight:700;color:${s.bar};border-right:3px solid ${s.bar}">${s.sign}</td><td style="padding:4px 8px;border-right:1px solid #eef0f4">${asis}</td><td style="padding:4px 8px">${tobe}</td></tr>`;
  }).join('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Schema diff · ${table.table}</title>
<style>
body{font:13px/1.4 -apple-system, system-ui, sans-serif; color:#0f1720; margin:24px;}
h1{font-size:18px;margin:0 0 4px} h2{font-size:12px;color:#68778f;margin:0 0 20px;font-family:ui-monospace,monospace;font-weight:400}
table{border-collapse:collapse;width:100%;font-family:ui-monospace,monospace;font-size:12px;border:1px solid #dfe4ec}
td{vertical-align:top}
</style></head><body>
<h1>Schema diff · ${table.table}</h1>
<h2>${table.asis} → ${table.tobe} · generated 2026-04-21</h2>
<table>${rowHtml}</table>
</body></html>`;
};

/* Code viewer for DDL / SQL / YAML / validation */
const CodeViewer = ({ filename, content, language }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>{filename}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
            {language} · {content.split('\n').length} lines · {(new Blob([content]).size)} bytes
          </div>
        </div>
        <Btn kind="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(content)}>Copy</Btn>
        <Btn kind="primary" size="sm" onClick={() => downloadBlob(filename, content)}>Download</Btn>
      </div>
      <pre style={{
        flex: 1, margin: 0, overflow: 'auto',
        padding: '12px 16px',
        background: '#0e1a2b', color: '#cad7e8',
        fontFamily: 'var(--mono)', fontSize: 11.5, lineHeight: 1.55,
      }}>
        {highlight(content, language)}
      </pre>
    </div>
  );
};

// Super-light syntax highlight (keyword spans)
const highlight = (code, lang) => {
  const kwRe = /\b(CREATE|TABLE|DROP|INSERT|INTO|SELECT|FROM|WHERE|PRIMARY|KEY|NOT|NULL|DEFAULT|AS|VARCHAR|CHAR|NUMERIC|SMALLINT|TIMESTAMP|DATE|BOOLEAN|UUID|INTEGER)\b/g;
  const strRe = /'[^']*'/g;
  const commentRe = /(--[^\n]*|#[^\n]*)/g;
  const parts = [];
  let i = 0;
  code.split('\n').forEach((line, idx) => {
    let rendered = line
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(commentRe, '§C§$1§/C§')
      .replace(strRe, '§S§$&§/S§')
      .replace(kwRe, '§K§$&§/K§');
    parts.push(
      <div key={idx} style={{ display: 'flex' }}>
        <span style={{ width: 32, color: '#455169', userSelect: 'none', textAlign: 'right', paddingRight: 10, flexShrink: 0 }}>{idx+1}</span>
        <span dangerouslySetInnerHTML={{ __html:
          rendered
            .replace(/§K§(.*?)§\/K§/g, '<span style="color:#7fb6ff;font-weight:600">$1</span>')
            .replace(/§S§(.*?)§\/S§/g, '<span style="color:#d4a96a">$1</span>')
            .replace(/§C§(.*?)§\/C§/g, '<span style="color:#5f7896;font-style:italic">$1</span>')
        }}/>
      </div>
    );
  });
  return parts;
};

/* ============================================================= */
/* Dashboard snapshot — Excel workbook                              */
/* ============================================================= */

const DashboardSnapshotView = ({ projectTables }) => {
  const fname = `dashboard-snapshot.dashboard.xlsx`;
  const tbls = projectTables || [];

  const totals = tbls.reduce((a, t) => ({
    rows: a.rows + t.rows,
    done: a.done + t.done,
    ok: a.ok + (t.status === 'ok' ? 1 : 0),
    running: a.running + (t.status === 'running' || t.status === 'warn' ? 1 : 0),
    issues: a.issues + (t.issues || 0),
    rules: a.rules + (t.rule || 0),
  }), { rows: 0, done: 0, ok: 0, running: 0, issues: 0, rules: 0 });

  const overviewSheet = () => (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(4)}</thead>
      <tbody>
        <tr><td style={xlsxRowNum}>1</td><td style={{...xlsxCell, fontSize: 14, fontWeight: 700, color: '#1d4d2e'}} colSpan="4">Dashboard snapshot</td></tr>
        <tr><td style={xlsxRowNum}>2</td><td style={xlsxCell} colSpan="4"/></tr>
        <tr><td style={xlsxRowNum}>3</td><td style={{...xlsxCell, fontWeight: 600}}>Captured</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="3">2026-04-21 09:41 JST</td></tr>
        <tr><td style={xlsxRowNum}>4</td><td style={{...xlsxCell, fontWeight: 600}}>Run</td><td style={{...xlsxCell, fontFamily: 'var(--mono)'}} colSpan="3">run-2026-0421-0914</td></tr>
        <tr><td style={xlsxRowNum}>5</td><td style={{...xlsxCell, fontWeight: 600}}>Author</td><td style={xlsxCell} colSpan="3">Henry Oh · KS Info System</td></tr>
        <tr><td style={xlsxRowNum}>6</td><td style={xlsxCell} colSpan="4"/></tr>
        <tr>
          <td style={xlsxRowNum}>7</td>
          {['Metric','Value','Unit','Note'].map(h => <td key={h} style={xlsxHeaderCell}>{h}</td>)}
        </tr>
        {[
          ['Tables', tbls.length, 'count', `${totals.ok} complete / ${totals.running} active`],
          ['Rows total', totals.rows.toLocaleString(), 'rows', 'all selected tables'],
          ['Rows migrated', totals.done.toLocaleString(), 'rows', `${((totals.done/totals.rows)*100).toFixed(2)}% overall`],
          ['Overall progress', ((totals.done/totals.rows)*100).toFixed(2) + '%', 'percent', 'sum of done ÷ sum of rows'],
          ['Mapping rules', totals.rules, 'count', 'applied across tables'],
          ['Open issues', totals.issues, 'count', totals.issues ? 'see Issues sheet' : 'clean'],
        ].map((r, i) => (
          <tr key={i}>
            <td style={xlsxRowNum}>{8 + i}</td>
            <td style={{...xlsxCell, fontWeight: 500}}>{r[0]}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{r[1]}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{r[2]}</td>
            <td style={{...xlsxCell, fontSize: 10.5, color: '#605e5c'}}>{r[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const tablesSheet = () => (
    <table style={xlsxTable}>
      <thead>{xlsxColHeadRow(9)}</thead>
      <tbody>
        <tr>
          <td style={xlsxRowNum}>1</td>
          {['Table','Schema','Rows','Migrated','Progress %','Rules','Issues','Status','Last update'].map(h => <td key={h} style={xlsxHeaderCell}>{h}</td>)}
        </tr>
        {tbls.map((t, i) => (
          <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
            <td style={xlsxRowNum}>{2 + i}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontWeight: 500}}>{t.name}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{t.schema}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{t.rows.toLocaleString()}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{t.done.toLocaleString()}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{t.pct.toFixed(1)}%</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: '#605e5c'}}>{t.rule}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right', color: t.issues ? '#a12929' : '#605e5c', fontWeight: t.issues ? 600 : 400}}>{t.issues || 0}</td>
            <td style={{
              ...xlsxCell, fontWeight: 600, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10.5,
              color: t.status === 'ok' ? '#1e7a2f' : t.status === 'blocked' ? '#a12929' : t.status === 'warn' ? '#7a5310' : t.status === 'queued' ? '#605e5c' : '#3a4a70',
              background: t.status === 'ok' ? '#e8f5ec' : t.status === 'blocked' ? '#fbeaea' : t.status === 'warn' ? '#fff3db' : t.status === 'queued' ? '#f5f5f5' : '#eef0f7',
            }}>{t.status}</td>
            <td style={{...xlsxCell, fontFamily: 'var(--mono)', fontSize: 10.5, color: '#605e5c'}}>{t.updated}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const issuesSheet = () => {
    const withIssues = tbls.filter(t => t.issues > 0 || t.status === 'blocked' || t.status === 'warn');
    return (
      <table style={xlsxTable}>
        <thead>{xlsxColHeadRow(4)}</thead>
        <tbody>
          <tr>
            <td style={xlsxRowNum}>1</td>
            {['Table','Status','Issues','Note'].map(h => <td key={h} style={xlsxHeaderCell}>{h}</td>)}
          </tr>
          {withIssues.length === 0 && (
            <tr><td style={xlsxRowNum}>2</td><td style={xlsxCell} colSpan="4">no open issues</td></tr>
          )}
          {withIssues.map((t, i) => (
            <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
              <td style={xlsxRowNum}>{2 + i}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)'}}>{t.name}</td>
              <td style={{
                ...xlsxCell, fontWeight: 600, fontFamily: 'var(--mono)', fontSize: 10.5,
                color: t.status === 'blocked' ? '#a12929' : '#7a5310',
                background: t.status === 'blocked' ? '#fbeaea' : '#fff3db',
              }}>{t.status}</td>
              <td style={{...xlsxCell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{t.issues || 0}</td>
              <td style={{...xlsxCell, fontSize: 10.5, color: '#605e5c'}}>
                {t.status === 'blocked' ? 'migration halted — needs triage'
                  : t.status === 'warn' ? 'encoded with warnings'
                  : 'see logs for detail'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const sheets = [
    { name: 'Overview', render: overviewSheet },
    { name: 'Tables', render: tablesSheet },
    { name: 'Issues', render: issuesSheet },
  ];

  const genDashboardText = () => {
    const lines = [];
    lines.push(`# Dashboard snapshot`);
    lines.push(`captured: 2026-04-21T09:41:00+09:00`);
    lines.push(`run: run-2026-0421-0914`);
    lines.push(``);
    lines.push(`metrics:`);
    lines.push(`  tables: ${tbls.length}`);
    lines.push(`  rows_total: ${totals.rows}`);
    lines.push(`  rows_migrated: ${totals.done}`);
    lines.push(`  overall_progress_pct: ${((totals.done/totals.rows)*100).toFixed(2)}`);
    lines.push(`  open_issues: ${totals.issues}`);
    lines.push(``);
    lines.push(`tables:`);
    tbls.forEach(t => {
      lines.push(`  - name: ${t.name}`);
      lines.push(`    schema: ${t.schema}`);
      lines.push(`    rows: ${t.rows}`);
      lines.push(`    done: ${t.done}`);
      lines.push(`    pct: ${t.pct.toFixed(2)}`);
      lines.push(`    rules: ${t.rule}`);
      lines.push(`    issues: ${t.issues || 0}`);
      lines.push(`    status: ${t.status}`);
    });
    return lines.join('\n');
  };

  return (
    <ExcelWorkbook
      filename={fname}
      cellRef="A1"
      formula={`= "Dashboard snapshot · ${tbls.length} tables · ${((totals.done/totals.rows)*100).toFixed(1)}% migrated"`}
      sheets={sheets}
      onDownload={() => downloadBlob(fname, genDashboardText(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    />
  );
};

/* Main Artifacts view */
const Artifacts = ({ tables, projectTables }) => {
  const [selected, setSelected] = React.useState({ cat: 'dashboard', table: '__project__' });
  const table = tables.find(t => t.table === selected.table) || tables[0];

  let body;
  if (selected.cat === 'dashboard') {
    body = <DashboardSnapshotView projectTables={projectTables}/>;
  } else if (selected.cat === 'diff') {
    body = <SchemaDiffView table={table}/>;
  } else if (selected.cat === 'ddl') {
    body = <CodeViewer filename={`${table.table.toLowerCase()}.ddl.sql`} content={genDDL(table)} language="sql"/>;
  } else if (selected.cat === 'sql') {
    body = <CodeViewer filename={`${table.table.toLowerCase()}.migrate.sql`} content={genMigrationSQL(table)} language="sql"/>;
  } else if (selected.cat === 'yaml') {
    body = <MappingExcelView table={table}/>;
  } else if (selected.cat === 'validation') {
    body = <ValidationExcelView table={table}/>;
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{
        width: 260, minWidth: 260,
        borderRight: '1px solid var(--border)',
        background: 'var(--panel)', overflow: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '8px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Artifacts</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-4)' }}>{tables.length * 5 + 1}</span>
          <div style={{ flex: 1 }}/>
          <Btn kind="secondary" size="sm" onClick={() => {
            // download everything as a flat zip-like bundle — just concat .tar.txt manifest
            const parts = [];
            tables.forEach(t => {
              parts.push(`===== ${t.table.toLowerCase()}.ddl.sql =====\n${genDDL(t)}\n`);
              parts.push(`===== ${t.table.toLowerCase()}.migrate.sql =====\n${genMigrationSQL(t)}\n`);
              parts.push(`===== ${t.table.toLowerCase()}.map.xlsx =====\n${genMappingYAML(t)}\n`);
              parts.push(`===== ${t.table.toLowerCase()}.report.xlsx =====\n${genValidation(t)}\n`);
            });
            downloadBlob(`artifacts-bundle.txt`, parts.join('\n'), 'text/plain');
          }}>Export all</Btn>
        </div>
        <ArtifactTree tables={tables} selected={selected} onSelect={setSelected}/>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {body}
      </div>
    </div>
  );
};

window.Artifacts = Artifacts;
