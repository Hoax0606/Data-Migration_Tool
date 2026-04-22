/* Empty state for freshly-created projects */

const EmptyProject = ({ project, tab }) => {
  const cfg = project.config || {};

  const perTab = {
    dashboard: {
      title: 'No tables discovered yet',
      sub: 'Connect to the source and run schema discovery to populate the migration catalogue.',
      cta: 'Run schema discovery',
      cmd: `migrate discover --project ${project.id} --source ${cfg.srcHost || '—'}`,
    },
    mapping: {
      title: 'Mapping definitions will appear here',
      sub: 'Once tables are discovered, auto-generate field mappings or import a YAML mapping file.',
      cta: 'Import mapping YAML',
      cmd: `migrate mapping auto --project ${project.id}`,
    },
    execution: {
      title: 'No runs yet',
      sub: 'Execution telemetry becomes available once a migration run is scheduled.',
      cta: 'Schedule first run',
      cmd: `migrate run --project ${project.id}${cfg.dryRun ? ' --dry-run' : ''}`,
    },
    logs: {
      title: 'Log stream is idle',
      sub: 'Logs from workers, encoder and loader will appear here in real time.',
      cta: 'Open tail',
      cmd: `migrate logs --follow --project ${project.id}`,
    },
  }[tab];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: 0, overflow: 'auto',
    }}>
      {/* Config summary strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr) auto',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        {[
          ['client', project.client],
          ['env', cfg.env],
          ['source', project.src],
          ['src encoding', cfg.srcEnc],
          ['target', project.tgt],
          ['tgt encoding', cfg.tgtEnc],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: '8px 12px', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text)', marginTop: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v || '—'}
            </div>
          </div>
        ))}
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center' }}>
          <StatusBadge tone="queued">draft</StatusBadge>
        </div>
      </div>

      {/* Empty body */}
      <div style={{
        flex: 1, display: 'grid', placeItems: 'center',
        padding: 40,
      }}>
        <div style={{
          width: 480, maxWidth: '100%',
          textAlign: 'center',
          border: '1px dashed var(--border-strong)',
          borderRadius: 4,
          padding: 28,
          background: 'var(--panel)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 6,
            background: 'var(--navy-50)', color: 'var(--navy)',
            display: 'grid', placeItems: 'center', margin: '0 auto 12px',
            fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700,
          }}>{tab[0].toUpperCase()}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{perTab.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>{perTab.sub}</div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11,
            background: '#0e1a2b', color: '#cad7e8',
            padding: '8px 10px', borderRadius: 3,
            textAlign: 'left', marginBottom: 14,
            overflow: 'auto', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#7a8aa6' }}>$ </span>{perTab.cmd}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <Btn kind="primary" size="sm" icon={<Ic.play/>}>{perTab.cta}</Btn>
            <Btn kind="secondary" size="sm">View settings</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

window.EmptyProject = EmptyProject;
