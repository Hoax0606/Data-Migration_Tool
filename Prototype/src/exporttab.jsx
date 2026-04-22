/* Export tab — bundle all artifacts for a project (or site).
   Shows a file-list manifest grouped by artifact type, with size/count,
   and big [Download all] button + per-format buttons.
   Nothing here actually writes files — it's a mock of the UX, but the
   manifest numbers are derived from real table/mapping counts. */

const ExportTab = ({ project, tables, mapping, scope = 'project' /* 'project' | 'site' */, allProjects }) => {
  const [selectedFormats, setSelectedFormats] = React.useState({
    ddl: true, migration: true, mapping: true, yaml: true, validation: true,
    dataDict: true, summary: true,
  });
  const [bundleFmt, setBundleFmt] = React.useState('zip'); // zip | tar.gz
  const [excelFmt, setExcelFmt] = React.useState('xlsx');   // xlsx | html

  const tableCount = scope === 'site'
    ? allProjects.reduce((a, p) => a + p.tables, 0)
    : tables.length;

  /* Build manifest — a list of (category, file, size) tuples */
  const manifest = React.useMemo(() => {
    const entries = [];
    const prefix = scope === 'site' ? 'site/' : `${slugify(project?.name || 'project')}/`;

    if (selectedFormats.ddl) {
      const list = (scope === 'site' ? allProjects : [project]).flatMap(p =>
        Array.from({ length: p.tables }, (_, i) => ({
          cat: 'DDL',
          path: `${prefix}${slugify(p.name)}/ddl/${paddedName(i)}.sql`,
          size: rand(i + 11, 4000, 18000),
          kind: 'sql',
        }))
      );
      entries.push(...list);
    }
    if (selectedFormats.migration) {
      const list = (scope === 'site' ? allProjects : [project]).flatMap(p =>
        Array.from({ length: p.tables }, (_, i) => ({
          cat: 'Migration SQL',
          path: `${prefix}${slugify(p.name)}/migration/${paddedName(i)}.up.sql`,
          size: rand(i + 21, 1200, 9200),
          kind: 'sql',
        }))
      );
      entries.push(...list);
    }
    if (selectedFormats.mapping) {
      const list = (scope === 'site' ? allProjects : [project]).flatMap(p =>
        Array.from({ length: p.tables }, (_, i) => ({
          cat: 'Mapping',
          path: `${prefix}${slugify(p.name)}/mapping/${paddedName(i)}.map.xlsx`,
          size: rand(i + 31, 12_000, 42_000),
          kind: 'xlsx',
        }))
      );
      entries.push(...list);
    }
    if (selectedFormats.yaml) {
      const list = (scope === 'site' ? allProjects : [project]).flatMap(p =>
        Array.from({ length: p.tables }, (_, i) => ({
          cat: 'Pipeline',
          path: `${prefix}${slugify(p.name)}/pipeline/${paddedName(i)}.pipeline.xlsx`,
          size: rand(i + 41, 10_000, 26_000),
          kind: 'xlsx',
        }))
      );
      entries.push(...list);
    }
    if (selectedFormats.validation) {
      const list = (scope === 'site' ? allProjects : [project]).flatMap(p =>
        Array.from({ length: p.tables }, (_, i) => ({
          cat: 'Validation',
          path: `${prefix}${slugify(p.name)}/validation/${paddedName(i)}.report.xlsx`,
          size: rand(i + 51, 18_000, 64_000),
          kind: 'xlsx',
        }))
      );
      entries.push(...list);
    }
    if (selectedFormats.dataDict) {
      const list = (scope === 'site' ? allProjects : [project]).map(p => ({
        cat: 'DB design spec',
        path: `${prefix}${slugify(p.name)}/db-design-spec.xlsx`,
        size: 40_000 + p.tables * 2800,
        kind: 'xlsx',
      }));
      entries.push(...list);
    }
    if (selectedFormats.summary) {
      if (scope === 'site') {
        entries.push({
          cat: 'Summary', path: `${prefix}site-summary.xlsx`, size: 680_000, kind: 'xlsx',
        });
      } else {
        entries.push({
          cat: 'Summary', path: `${prefix}project-summary.xlsx`, size: 320_000, kind: 'xlsx',
        });
      }
    }
    return entries;
  }, [selectedFormats, scope, project, allProjects, excelFmt]);

  const grouped = {};
  manifest.forEach(m => { (grouped[m.cat] = grouped[m.cat] || []).push(m); });
  const totalSize = manifest.reduce((a, m) => a + m.size, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%', minHeight: 0 }}>
      {/* Left: picker */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'var(--mono)' }}>
            {scope === 'site' ? 'site export' : 'project export'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
            {scope === 'site' ? (window.TENANT || 'KDB Bank') : project?.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
            {tableCount} tables · {manifest.length} files · {fmtBytes(totalSize)}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
          <SectionHead>Artifact formats</SectionHead>
          <CheckRow label="DDL (.sql)"             hint={`one per table`} checked={selectedFormats.ddl}
            onChange={v => setSelectedFormats(s => ({ ...s, ddl: v }))}/>
          <CheckRow label="Migration (.sql)"       hint="up + down per table" checked={selectedFormats.migration}
            onChange={v => setSelectedFormats(s => ({ ...s, migration: v }))}/>
          <CheckRow label="Mapping (.xlsx)"        hint="column-level rules" checked={selectedFormats.mapping}
            onChange={v => setSelectedFormats(s => ({ ...s, mapping: v }))}/>
          <CheckRow label="Pipeline (.xlsx)"       hint="per-table job spec" checked={selectedFormats.yaml}
            onChange={v => setSelectedFormats(s => ({ ...s, yaml: v }))}/>
          <CheckRow label="Validation (.xlsx)"     hint="PK/FK/NULL/sum report" checked={selectedFormats.validation}
            onChange={v => setSelectedFormats(s => ({ ...s, validation: v }))}/>

          <div style={{ height: 10 }}/>
          <SectionHead>Documents</SectionHead>
          <CheckRow label="DB design spec (.xlsx)"  hint="per project" checked={selectedFormats.dataDict}
            onChange={v => setSelectedFormats(s => ({ ...s, dataDict: v }))}/>
          <CheckRow label={scope === 'site' ? 'Site summary (.xlsx)' : 'Project summary (.xlsx)'}
            hint={scope === 'site' ? 'overview workbook' : 'executive workbook'} checked={selectedFormats.summary}
            onChange={v => setSelectedFormats(s => ({ ...s, summary: v }))}/>

          <div style={{ height: 12 }}/>
          <SectionHead>Bundle format</SectionHead>
          <div style={{ display: 'flex', gap: 5 }}>
            <Seg options={['zip','tar.gz']} value={bundleFmt} onChange={setBundleFmt}/>
          </div>
        </div>

        {/* CTA bar */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--panel-2)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <Btn kind="primary" icon={<Ic.download/>}
            onClick={() => alert(`Generating ${bundleFmt} bundle…\n${manifest.length} files · ${fmtBytes(totalSize)}`)}
            style={{ width: '100%', justifyContent: 'center', height: 32, fontSize: 12.5 }}
          >
            Download bundle ({fmtBytes(totalSize)})
          </Btn>
          <div style={{ display: 'flex', gap: 5 }}>
            <Btn kind="secondary" size="sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => alert('Copying manifest…')}>Copy manifest</Btn>
            <Btn kind="secondary" size="sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => alert(`Opening DB design spec (${excelFmt})…`)}>Preview spec</Btn>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)', textAlign: 'center' }}>
            signed · sha256 + pgp · will be logged to audit
          </div>
        </div>
      </div>

      {/* Right: manifest preview */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Tab-bar showing the two preview modes */}
        <PreviewArea
          manifest={manifest} grouped={grouped}
          scope={scope} project={project} tables={tables} mapping={mapping} allProjects={allProjects}
          excelFmt={excelFmt}
        />
      </div>
    </div>
  );
};

/* ============================================================= */

const PreviewArea = ({ manifest, grouped, scope, project, tables, mapping, allProjects, excelFmt }) => {
  const [view, setView] = React.useState('spec'); // spec | manifest | summary

  return (
    <>
      <div style={{
        display: 'flex', padding: '0 14px',
        borderBottom: '1px solid var(--border)', background: 'var(--panel)', height: 32,
      }}>
        {[
          { k: 'spec',     l: 'DB design spec' },
          { k: 'summary',  l: scope === 'site' ? 'Site summary' : 'Project summary' },
          { k: 'manifest', l: `Manifest (${manifest.length})` },
        ].map(t => (
          <button key={t.k} onClick={() => setView(t.k)}
            style={{
              padding: '0 13px',
              border: 'none', background: 'transparent',
              fontSize: 11.5, fontWeight: view === t.k ? 600 : 500,
              color: view === t.k ? 'var(--navy)' : 'var(--text-2)',
              cursor: 'pointer',
              borderBottom: view === t.k ? '2px solid var(--navy)' : '2px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>{t.l}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          preview only · download to save
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: view === 'manifest' ? 'var(--panel)' : 'var(--panel-2)' }}>
        {view === 'spec'     && <DesignSpecPreview project={project} tables={tables} mapping={mapping} scope={scope} allProjects={allProjects} fmt={excelFmt}/>}
        {view === 'summary'  && <SummaryPreview scope={scope} project={project} allProjects={allProjects}/>}
        {view === 'manifest' && <ManifestPreview grouped={grouped}/>}
      </div>
    </>
  );
};

/* ============================================================= */
/* DB Design Spec (Excel-style) preview                           */
/* ============================================================= */

const DesignSpecPreview = ({ project, tables, mapping, scope, allProjects, fmt }) => {
  const displayName = scope === 'site' ? (window.TENANT || 'KDB Bank') : project?.name;
  const sheetList = scope === 'site'
    ? ['Cover', 'All tables', ...allProjects.map(p => p.name)]
    : ['Cover', 'Tables', 'Columns', 'Mapping', 'Validation'];
  const [sheet, setSheet] = React.useState(sheetList[0]);

  /* fake but plausible per-column spec rows */
  const columnSpec = React.useMemo(() => buildColumnSpec(), []);

  return (
    <div style={{ padding: 14 }}>
      {/* Workbook window */}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(20,30,50,.04)',
        overflow: 'hidden',
      }}>
        {/* Excel-ish title bar */}
        <div style={{
          padding: '7px 12px',
          background: '#217346',
          color: '#fff',
          fontSize: 11, fontFamily: 'var(--mono)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 16, height: 16, borderRadius: 2,
            background: '#fff', color: '#217346',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 10,
          }}>X</span>
          <span>db-design-spec — {slugify(displayName)}.{fmt}</span>
          <span style={{ color: 'rgba(255,255,255,.6)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,.7)' }}>read-only preview</span>
        </div>

        {/* Ribbon */}
        <div style={{
          background: '#f3f2f1',
          borderBottom: '1px solid #d0cfce',
          padding: '4px 10px',
          fontSize: 10.5, color: '#605e5c',
          display: 'flex', gap: 12,
          fontFamily: 'var(--sans)',
        }}>
          {['File','Home','Insert','Page Layout','Formulas','Data','Review','View'].map((m, i) => (
            <span key={m} style={{
              padding: '3px 8px',
              background: i === 1 ? '#fff' : 'transparent',
              borderBottom: i === 1 ? '2px solid #217346' : 'none',
              color: i === 1 ? '#217346' : '#605e5c',
            }}>{m}</span>
          ))}
        </div>

        {/* Cell name/formula row */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderBottom: '1px solid #d0cfce',
          background: '#fff',
          fontFamily: 'var(--mono)', fontSize: 10.5,
        }}>
          <div style={{
            padding: '3px 8px', width: 56,
            borderRight: '1px solid #d0cfce',
            color: '#605e5c',
          }}>A1</div>
          <div style={{ padding: '3px 8px', color: '#201f1e' }}>
            <span style={{ color: '#605e5c' }}>fx  </span>
            = "{displayName} / Database Design Specification"
          </div>
        </div>

        {/* Sheet content */}
        {sheet === 'Cover' && <CoverSheet displayName={displayName} scope={scope} project={project} allProjects={allProjects} tableCount={scope === 'site' ? allProjects.reduce((a,p)=>a+p.tables,0) : tables.length}/>}
        {(sheet === 'Tables' || sheet === 'All tables') && <TablesSheet tables={tables} scope={scope} allProjects={allProjects}/>}
        {sheet === 'Columns'    && <ColumnsSheet rows={columnSpec}/>}
        {sheet === 'Mapping'    && <MappingSheet mapping={mapping}/>}
        {sheet === 'Validation' && <ValidationSheet tables={tables}/>}
        {scope === 'site' && allProjects.find(p => p.name === sheet) && (
          <TablesSheet tables={tables} scope="project" allProjects={[allProjects.find(p => p.name === sheet)]}/>
        )}

        {/* Sheet tabs */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid #d0cfce',
          background: '#f3f2f1',
          overflowX: 'auto',
        }}>
          {sheetList.map(s => (
            <button key={s} onClick={() => setSheet(s)}
              style={{
                padding: '4px 12px',
                border: 'none',
                background: sheet === s ? '#fff' : 'transparent',
                borderRight: '1px solid #d0cfce',
                borderTop: sheet === s ? '2px solid #217346' : 'none',
                marginTop: sheet === s ? -1 : 0,
                color: sheet === s ? '#217346' : '#605e5c',
                fontFamily: 'var(--sans)',
                fontSize: 11,
                fontWeight: sheet === s ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>{s}</button>
          ))}
          <div style={{ flex: 1 }}/>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 10 }}>
        rendered in-browser · actual file is a native .{fmt} workbook with {sheetList.length} sheet(s)
      </div>
    </div>
  );
};

/* ----- Spec sheets ----- */

const xlsxHead = (cols) => (
  <tr>
    <th style={corner}/>
    {cols.map((c, i) => <th key={i} style={colHead}>{String.fromCharCode(65 + i)}</th>)}
  </tr>
);
const xlsxHeader = (labels) => (
  <tr style={{ background: '#f8f8f8' }}>
    <td style={rowNum}>2</td>
    {labels.map((l, i) => (
      <td key={i} style={{ ...cell, fontWeight: 600, background: '#edf4ee', color: '#1d4d2e' }}>{l}</td>
    ))}
  </tr>
);

const CoverSheet = ({ displayName, scope, project, allProjects, tableCount }) => (
  <table style={xlsxTable}>
    <thead>{xlsxHead(['A','B','C','D'])}</thead>
    <tbody>
      <tr><td style={rowNum}>1</td><td style={{...cell, fontSize: 18, fontWeight: 700, color: '#1d4d2e'}} colSpan="4">{displayName} — Database Design Specification</td></tr>
      <tr><td style={rowNum}>2</td><td style={cell} colSpan="4"/></tr>
      <tr><td style={rowNum}>3</td><td style={{...cell, fontWeight: 600}}>Document ID</td><td style={cell} colSpan="3">DDS-{slugify(displayName).toUpperCase()}-2026-04-21</td></tr>
      <tr><td style={rowNum}>4</td><td style={{...cell, fontWeight: 600}}>Version</td><td style={cell} colSpan="3">v4.12.0</td></tr>
      <tr><td style={rowNum}>5</td><td style={{...cell, fontWeight: 600}}>Issued</td><td style={cell} colSpan="3">2026-04-21 09:41 JST</td></tr>
      <tr><td style={rowNum}>6</td><td style={{...cell, fontWeight: 600}}>Author</td><td style={cell} colSpan="3">Henry Oh · KS Info System</td></tr>
      <tr><td style={rowNum}>7</td><td style={{...cell, fontWeight: 600}}>Classification</td><td style={cell} colSpan="3">Internal · Migration program</td></tr>
      <tr><td style={rowNum}>8</td><td style={cell} colSpan="4"/></tr>
      <tr><td style={rowNum}>9</td><td style={{...cell, fontWeight: 600}} colSpan="4">Scope</td></tr>
      <tr><td style={rowNum}>10</td><td style={cell} colSpan="4">
        {scope === 'site'
          ? `Site-wide specification covering all ${allProjects.length} migration projects at ${displayName}, totalling ${tableCount.toLocaleString()} tables.`
          : `Migration program ${project?.name} — ${tableCount} tables from ${project?.src} to ${project?.tgt}.`}
      </td></tr>
      <tr><td style={rowNum}>11</td><td style={cell} colSpan="4"/></tr>
      <tr><td style={rowNum}>12</td><td style={{...cell, fontWeight: 600}} colSpan="4">Revision history</td></tr>
      <tr style={{ background: '#edf4ee' }}>
        <td style={rowNum}>13</td>
        {['Ver','Date','Author','Change'].map(h => <td key={h} style={{...cell, fontWeight: 600, color: '#1d4d2e'}}>{h}</td>)}
      </tr>
      {[
        ['v4.12.0','2026-04-21','H. Oh','site export support, add validation sheet'],
        ['v4.11.0','2026-04-08','H. Oh','character-set conversion plan (EBCDIC-KANA)'],
        ['v4.10.0','2026-03-22','J. Park','initial spec draft'],
      ].map((r, i) => (
        <tr key={i}>
          <td style={rowNum}>{14 + i}</td>
          {r.map((c, j) => <td key={j} style={cell}>{c}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);

const TablesSheet = ({ tables, scope, allProjects }) => {
  const rows = scope === 'site'
    ? allProjects.flatMap(p => Array.from({length: Math.min(p.tables, 8)}, (_, i) => [
        p.name, `TBL_${String(i+1).padStart(3,'0')}`, `${p.src.split(' ')[0]}`, `${p.tgt.split(' ')[0]}`, rand(i,100,500000).toLocaleString(), rand(i,1,40), rand(i,0,2),
      ]))
    : tables.map(t => [t.schema, t.name, 'EBCDIC', 'UTF-8', t.rows.toLocaleString(), t.rule, t.issues]);
  const headers = scope === 'site'
    ? ['Project','Table','Source enc','Target enc','Rows','Rules','Issues']
    : ['Schema','Table','Source enc','Target enc','Rows','Rules','Issues'];

  return (
    <table style={xlsxTable}>
      <thead>{xlsxHead(Array.from({length: headers.length}, (_, i) => i))}</thead>
      <tbody>
        {xlsxHeader(headers)}
        {rows.map((r, i) => (
          <tr key={i}>
            <td style={rowNum}>{3 + i}</td>
            {r.map((c, j) => (
              <td key={j} style={{
                ...cell,
                textAlign: j >= 4 ? 'right' : 'left',
                fontFamily: j >= 4 ? 'var(--mono)' : 'var(--sans)',
                color: j === 6 && +c > 0 ? '#a12929' : 'inherit',
              }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ColumnsSheet = ({ rows }) => (
  <table style={xlsxTable}>
    <thead>{xlsxHead(Array.from({length: 9}, (_, i) => i))}</thead>
    <tbody>
      {xlsxHeader(['Table','Col #','Source column','Source type','Target column','Target type','Nullable','PK','Transform'])}
      {rows.map((r, i) => (
        <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
          <td style={rowNum}>{3 + i}</td>
          {r.map((c, j) => (
            <td key={j} style={{
              ...cell,
              fontFamily: j === 3 || j === 5 ? 'var(--mono)' : 'var(--sans)',
              fontSize: j === 3 || j === 5 ? 10.5 : 11,
              textAlign: j === 1 || j === 6 || j === 7 ? 'center' : 'left',
            }}>{c}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const MappingSheet = ({ mapping }) => (
  <table style={xlsxTable}>
    <thead>{xlsxHead(Array.from({length: 7}, (_, i) => i))}</thead>
    <tbody>
      {xlsxHeader(['Source','Source type','Target','Target type','Rule','Status','Note'])}
      {mapping.map((m, i) => (
        <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
          <td style={rowNum}>{3 + i}</td>
          <td style={{...cell, fontFamily: 'var(--mono)'}}>{m.src}</td>
          <td style={{...cell, fontFamily: 'var(--mono)', fontSize: 10.5}}>{m.srcType}</td>
          <td style={{...cell, fontFamily: 'var(--mono)'}}>{m.tgt}</td>
          <td style={{...cell, fontFamily: 'var(--mono)', fontSize: 10.5}}>{m.tgtType}</td>
          <td style={{...cell}}>{m.rule}</td>
          <td style={{...cell, color: m.status === 'err' ? '#a12929' : m.status === 'warn' ? '#8a5a06' : '#1e7a2f'}}>{m.status}</td>
          <td style={{...cell, fontSize: 10.5, color: '#605e5c'}}>{m.note || '—'}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ValidationSheet = ({ tables }) => (
  <table style={xlsxTable}>
    <thead>{xlsxHead(Array.from({length: 8}, (_, i) => i))}</thead>
    <tbody>
      {xlsxHeader(['Table','Rows ASIS','Rows TOBE','Δ rows','Sum(amt) ASIS','Sum(amt) TOBE','Δ %','Verdict'])}
      {tables.map((t, i) => {
        const asis = t.rows;
        const tobe = t.done || t.rows;
        const sumA = asis * 1342 + ((i * 31) % 1000);
        const sumB = sumA - (t.issues || 0) * 1342 + (i % 2 === 0 ? 0 : 2);
        const delta = sumA ? ((sumB - sumA) / sumA) * 100 : 0;
        const ok = Math.abs(delta) < 0.001 && t.issues === 0;
        return (
          <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
            <td style={rowNum}>{3 + i}</td>
            <td style={{...cell, fontFamily: 'var(--mono)'}}>{t.name}</td>
            <td style={{...cell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{asis.toLocaleString()}</td>
            <td style={{...cell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{tobe.toLocaleString()}</td>
            <td style={{...cell, fontFamily: 'var(--mono)', textAlign: 'right', color: asis - tobe ? '#8a5a06' : '#1e7a2f'}}>{(tobe - asis) >= 0 ? '+' : ''}{(tobe - asis).toLocaleString()}</td>
            <td style={{...cell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{sumA.toLocaleString()}</td>
            <td style={{...cell, fontFamily: 'var(--mono)', textAlign: 'right'}}>{sumB.toLocaleString()}</td>
            <td style={{...cell, fontFamily: 'var(--mono)', textAlign: 'right', color: Math.abs(delta) > 0.001 ? '#a12929' : '#1e7a2f'}}>{delta.toFixed(4)}%</td>
            <td style={{
              ...cell,
              fontWeight: 600,
              color: ok ? '#1e7a2f' : '#a12929',
              background: ok ? '#e8f5ec' : '#fbeaea',
            }}>{ok ? '✓ PASS' : '✗ FAIL'}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

/* ============================================================= */
/* Site/Project Summary (PDF-style)                                */
/* ============================================================= */

const SummaryPreview = ({ scope, project, allProjects }) => {
  const displayName = scope === 'site' ? (window.TENANT || 'KDB Bank') : project?.name;
  return (
    <div style={{ padding: 14, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 820, background: '#fff',
        border: '1px solid var(--border)',
        padding: '40px 56px',
        boxShadow: '0 2px 8px rgba(20,30,50,.04)',
        fontFamily: "'Times New Roman', serif",
        color: '#1a2330',
      }}>
        <div style={{ fontSize: 10.5, letterSpacing: 1.2, color: '#8892a0', textTransform: 'uppercase', marginBottom: 6 }}>
          Migration Program · Summary Report
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>
          {displayName}
        </h1>
        <div style={{ fontSize: 12, color: '#4a5463', marginTop: 4, marginBottom: 20 }}>
          2026-04-21 · Document DDS-{slugify(displayName).toUpperCase()}-2026-04-21 · Henry Oh (KS Info System)
        </div>
        <hr style={{ border: 'none', borderTop: '2px solid #1a2330', marginBottom: 18 }}/>

        <h2 style={summaryH2}>1 · Executive summary</h2>
        <p style={summaryP}>
          This document summarizes the {scope === 'site' ? 'bank-wide' : 'program-scoped'} data migration effort from legacy systems
          (primarily IBM z/OS mainframe EBCDIC datasets and Oracle 11g/12c) into modernized PostgreSQL 15 targets.
          As of the issue date, {scope === 'site' ? `${allProjects.length} sub-projects are tracked` : `this program is tracked independently`},
          covering {scope === 'site' ? allProjects.reduce((a,p)=>a+p.tables,0).toLocaleString() : project?.tables} tables.
        </p>

        <h2 style={summaryH2}>2 · Rows processed</h2>
        <table style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 11, borderCollapse: 'collapse', margin: '6px 0 16px' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #1a2330' }}>
              {['Project','Rows total','Processed','%','Errors','Warn'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, fontSize: 10.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(scope === 'site' ? allProjects : [project]).map((p, i) => {
              const total = p.tables * 180_000 * 1.5;
              const done = p.status === 'done' ? total : total * (p.status === 'waiting' ? 0.1 : 0.7);
              return (
                <tr key={i} style={{ borderBottom: '1px dotted #b4bcc6' }}>
                  <td style={{ padding: '5px 8px' }}>{p.name}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{abbr(total)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{abbr(done)}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{((done/total)*100).toFixed(1)}%</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{p.status === 'running' ? 2 : 0}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{p.status === 'waiting' ? 0 : 4}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 style={summaryH2}>3 · Validation results</h2>
        <p style={summaryP}>
          Row-count reconciliation and SHA-256 checksum verification ran on all completed tables.
          Amount-column summations (Kahan-compensated) match between source and target within 0.001 % tolerance on {scope === 'site' ? 'all' : 'all'} tables
          except for known PK-violation rows quarantined to the recovery queue. See appendix A for per-table verdicts.
        </p>

        <h2 style={summaryH2}>4 · Known issues</h2>
        <ol style={{ ...summaryP, paddingLeft: 20 }}>
          <li>4 rows in <code>GL_ENTRY</code> violate FK to <code>ACCT_MASTER.account_no</code> (first: <code>AC00881104</code>) — held in recovery queue.</li>
          <li>Invalid EBCDIC byte <code>0x3F</code> at offset <code>0x1A08B2C</code> in <code>KYC_DOCUMENT</code> — decode aborted, batch requeued.</li>
          <li>14 rows in <code>TXN_JOURNAL_2024</code> had <code>last_txn_ts = '00000000000000'</code> — null-coerced per mapping rule.</li>
        </ol>

        <h2 style={summaryH2}>5 · Sign-off</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 30 }}>
          <div>
            <div style={{ borderBottom: '1px solid #1a2330', marginBottom: 4, paddingBottom: 30 }}/>
            <div style={{ fontSize: 11 }}>Migration PM · KS Info System</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #1a2330', marginBottom: 4, paddingBottom: 30 }}/>
            <div style={{ fontSize: 11 }}>Data Governance · {window.TENANT || 'KDB Bank'}</div>
          </div>
        </div>

        <div style={{ marginTop: 40, fontSize: 10, color: '#8892a0', textAlign: 'center' }}>
          — Page 1 of 6 —
        </div>
      </div>
    </div>
  );
};

/* ============================================================= */
/* Manifest preview                                                */
/* ============================================================= */

const ManifestPreview = ({ grouped }) => (
  <div style={{ padding: 0 }}>
    {Object.entries(grouped).map(([cat, files]) => (
      <details key={cat} open style={{ borderBottom: '1px solid var(--border)' }}>
        <summary style={{
          padding: '7px 14px',
          background: 'var(--panel-2)',
          fontSize: 11, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', listStyle: 'none',
          userSelect: 'none',
        }}>
          <Ic.chev/>
          <span style={{ color: 'var(--navy)' }}>{cat}</span>
          <span style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 400 }}>{files.length} files · {fmtBytes(files.reduce((a, f) => a + f.size, 0))}</span>
        </summary>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--mono)' }}>
          <tbody>
            {files.slice(0, 80).map((f, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '3px 14px', color: 'var(--text-2)', width: '70%' }}>{f.path}</td>
                <td style={{ padding: '3px 14px', color: 'var(--text-3)', width: 70 }}>{f.kind}</td>
                <td style={{ padding: '3px 14px', color: 'var(--text-3)', textAlign: 'right', width: 90 }}>{fmtBytes(f.size)}</td>
                <td style={{ padding: '3px 14px', width: 80 }}>
                  <button style={miniBtn2} onClick={() => alert(`Download ${f.path}`)}>Download</button>
                </td>
              </tr>
            ))}
            {files.length > 80 && (
              <tr><td colSpan="4" style={{ padding: '6px 14px', color: 'var(--text-3)', fontStyle: 'italic' }}>
                …{files.length - 80} more files
              </td></tr>
            )}
          </tbody>
        </table>
      </details>
    ))}
  </div>
);

/* ============================================================= */
/* small helpers                                                    */
/* ============================================================= */

const SectionHead = ({ children }) => (
  <div style={{
    fontSize: 10, fontFamily: 'var(--mono)',
    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7,
    marginBottom: 6,
  }}>{children}</div>
);

const CheckRow = ({ label, hint, checked, onChange }) => (
  <label style={{
    display: 'flex', alignItems: 'flex-start', gap: 7,
    padding: '4px 0', cursor: 'pointer',
  }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      style={{ marginTop: 2, accentColor: 'var(--navy)' }}/>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: 'var(--text)' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{hint}</div>
    </div>
  </label>
);

const Seg = ({ options, value, onChange }) => (
  <div style={{
    display: 'inline-flex',
    border: '1px solid var(--border)', borderRadius: 3,
    overflow: 'hidden',
  }}>
    {options.map((o, i) => (
      <button key={o} onClick={() => onChange(o)}
        style={{
          padding: '3px 10px',
          border: 'none',
          background: value === o ? 'var(--navy)' : 'var(--panel)',
          color: value === o ? '#fff' : 'var(--text-2)',
          fontSize: 11, fontFamily: 'var(--mono)',
          cursor: 'pointer',
          borderLeft: i ? '1px solid var(--border)' : 'none',
        }}>{o}</button>
    ))}
  </div>
);

const xlsxTable = { width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--sans)' };
const corner = { width: 32, background: '#f3f2f1', borderBottom: '1px solid #d0cfce', borderRight: '1px solid #d0cfce' };
const colHead = {
  padding: '2px 6px', background: '#f3f2f1', color: '#605e5c',
  borderBottom: '1px solid #d0cfce', borderRight: '1px solid #d0cfce',
  fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--mono)', minWidth: 80, textAlign: 'center',
};
const rowNum = {
  background: '#f3f2f1', color: '#605e5c', fontFamily: 'var(--mono)',
  borderRight: '1px solid #d0cfce', borderBottom: '1px solid #e1dfdd',
  fontSize: 10.5, padding: '2px 6px', textAlign: 'right', width: 32,
};
const cell = {
  padding: '3px 8px',
  borderRight: '1px solid #e1dfdd',
  borderBottom: '1px solid #e1dfdd',
  fontSize: 11, color: '#1a2330',
  whiteSpace: 'nowrap',
};
const summaryH2 = { fontSize: 15, margin: '18px 0 6px', fontWeight: 700 };
const summaryP = { fontSize: 12.5, lineHeight: 1.55, color: '#1a2330', margin: '0 0 10px' };
const miniBtn2 = {
  padding: '1px 7px', fontSize: 10.5,
  border: '1px solid var(--border-strong)', background: 'var(--panel)',
  borderRadius: 3, cursor: 'pointer', color: 'var(--text-2)',
  fontFamily: 'var(--sans)',
};

function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function paddedName(i) { return `tbl_${String(i + 1).padStart(3, '0')}`; }
function rand(seed, lo, hi) { const x = ((seed * 9301 + 49297) % 233280) / 233280; return Math.round(lo + x * (hi - lo)); }
function fmtBytes(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GB';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' KB';
  return n + ' B';
}

function buildColumnSpec() {
  /* A few dozen sample rows across multiple tables */
  const out = [];
  const tbls = ['ACCT_MASTER', 'CUST_PROFILE', 'TXN_JOURNAL_2024', 'LOAN_REPAYMENT', 'GL_ENTRY'];
  const samples = [
    ['ACCT_NO','CHAR(16)','account_no','VARCHAR(16)','NO','✓','auto'],
    ['CUST_ID','CHAR(10)','customer_id','VARCHAR(10)','NO','—','auto'],
    ['BR_CODE','CHAR(4)','branch_code','CHAR(4)','NO','—','auto'],
    ['BAL_AMT','COMP-3 S9(13)V99','balance_amount','NUMERIC(15,2)','NO','—','unpack.comp3'],
    ['OPEN_DT','CHAR(8) YYYYMMDD','opened_at','DATE','NO','—','to_date(?,YYYYMMDD)'],
    ['STATUS_FLG','CHAR(1)','status','VARCHAR(12)','NO','—','LOOKUP(status_dict)'],
    ['ACCT_NAME_KANJI','CHAR(40) EBCDIC-KANA','account_name','VARCHAR(80)','YES','—','iconv ebcdic-kana→utf-8'],
    ['FILLER_01','CHAR(20)','—','—','YES','—','SKIP (padding)'],
    ['UPD_TS','CHAR(14)','updated_at','TIMESTAMP','YES','—','to_ts(YYYYMMDDHHMISS)'],
  ];
  tbls.forEach(t => {
    samples.forEach((r, idx) => out.push([t, idx + 1, ...r]));
  });
  return out;
}

Object.assign(window, { ExportTab });
