/* Project Settings tab — general, source/target, schedule, notifications, danger zone */

const ProjectSettings = ({ project, onDelete, onDuplicate, onRename }) => {
  const [section, setSection] = React.useState('general');

  const sections = [
    { k: 'general',  l: 'General',        d: 'Name, steward, environment' },
    { k: 'source',   l: 'Source',         d: 'Legacy system connection' },
    { k: 'target',   l: 'Target',         d: 'Destination DB & encoding' },
    { k: 'schedule', l: 'Schedule',       d: 'Runs & cutover window' },
    { k: 'notify',   l: 'Notifications',  d: 'Slack, email, webhooks' },
    { k: 'access',   l: 'Access',         d: 'Members on this project' },
    { k: 'danger',   l: 'Danger zone',    d: 'Delete project',   danger: true },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <aside style={{
        width: 200, minWidth: 200,
        borderRight: '1px solid var(--border)',
        background: 'var(--panel)',
        padding: '10px 0',
        overflow: 'auto',
      }}>
        <div style={{
          padding: '4px 14px 6px',
          fontSize: 10, fontFamily: 'var(--mono)',
          color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.7,
        }}>Project settings</div>
        {sections.map(s => {
          const active = s.k === section;
          return (
            <div key={s.k}
              onClick={() => setSection(s.k)}
              style={{
                position: 'relative',
                padding: '6px 14px 7px',
                cursor: 'pointer',
                background: active ? (s.danger ? '#fbeaea' : 'var(--navy-50)') : 'transparent',
                borderLeft: active ? `2px solid ${s.danger ? '#a12929' : 'var(--navy)'}` : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? (s.danger ? '#a12929' : 'var(--navy)') : (s.danger ? '#a12929' : 'var(--text)'),
              }}>{s.l}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>{s.d}</div>
            </div>
          );
        })}
      </aside>

      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '18px 26px 40px' }}>
        {section === 'general'  && <PSGeneral  project={project} onRename={onRename}/>}
        {section === 'source'   && <PSSource   project={project}/>}
        {section === 'target'   && <PSTarget   project={project}/>}
        {section === 'schedule' && <PSSchedule project={project}/>}
        {section === 'notify'   && <PSNotify/>}
        {section === 'access'   && <PSAccess/>}
        {section === 'danger'   && <PSDanger project={project} onDelete={onDelete} onDuplicate={onDuplicate}/>}
      </div>
    </div>
  );
};

/* reuse SS primitives */
const PSHead = SSHead;
const PSCard = SSCard;
const PSRow = SSRow;
const PSInput = SSInput;
const PSToggle = SSToggle;

const PSGeneral = ({ project, onRename }) => {
  const [name, setName] = React.useState(project.name);
  const [env, setEnv] = React.useState(project.env || 'stg');
  return (
    <>
      <PSHead title="General" desc="Basic metadata for this project."
        actions={<Btn kind="primary" size="sm" onClick={() => onRename?.(name)}>Save changes</Btn>}/>
      <PSCard>
        <PSRow label="Project name"><PSInput value={name} onChange={setName}/></PSRow>
        <PSRow label="Client" hint="Tenant division that owns this project.">
          <PSInput value="KDB Bank · Core Banking" mono/>
        </PSRow>
        <PSRow label="Environment">
          <div style={{ display: 'flex', gap: 6 }}>
            {['dev','stg','prod'].map(e => (
              <button key={e} onClick={() => setEnv(e)}
                style={{
                  padding: '3px 12px', fontSize: 11, fontFamily: 'var(--mono)',
                  border: `1px solid ${env === e ? 'var(--navy)' : 'var(--border)'}`,
                  background: env === e ? 'var(--navy)' : 'var(--panel)',
                  color: env === e ? '#fff' : 'var(--text-2)',
                  borderRadius: 3, cursor: 'pointer',
                }}>{e}</button>
            ))}
          </div>
        </PSRow>
        <PSRow label="Steward"><PSInput value="henry.oh@ksinfo.co.kr" mono/></PSRow>
        <PSRow label="Created"><PSInput value="2026-02-11 14:20 KST · by henry.oh" readOnly mono/></PSRow>
      </PSCard>
    </>
  );
};

const PSSource = ({ project }) => (
  <>
    <PSHead title="Source" desc="Legacy system this project reads from."
      actions={<Btn kind="secondary" size="sm">Test connection</Btn>}/>
    <PSCard>
      <PSRow label="System"><PSInput value={project.src || 'Mainframe · EBCDIC VSAM'} readOnly mono/></PSRow>
      <PSRow label="Host / path"><PSInput value="mvs-prod.kdb.internal:/vol/mig/CORE/*.dat" mono/></PSRow>
      <PSRow label="Source encoding"><PSInput value="IBM-933 (EBCDIC-KO)" mono/></PSRow>
      <PSRow label="Record length"><PSInput value="512" mono suffix="bytes" width={120}/></PSRow>
      <PSRow label="Copybook"><PSInput value="copybook/CIF_MSTR.cpy · 142 fields" mono/></PSRow>
      <PSRow label="Read-only guarantee"><PSToggle on={true} label="Source opened in read-only mode"/></PSRow>
    </PSCard>
  </>
);

const PSTarget = ({ project }) => (
  <>
    <PSHead title="Target" desc="Destination database for migrated data."
      actions={<Btn kind="secondary" size="sm">Test connection</Btn>}/>
    <PSCard>
      <PSRow label="System"><PSInput value={project.tgt || 'PostgreSQL 15'} readOnly mono/></PSRow>
      <PSRow label="Host"><PSInput value="pg-core-01.kdb.internal:5432" mono/></PSRow>
      <PSRow label="Database"><PSInput value="core_banking" mono/></PSRow>
      <PSRow label="Schema"><PSInput value="public" mono/></PSRow>
      <PSRow label="Target encoding"><PSInput value="UTF-8" mono/></PSRow>
      <PSRow label="Collation"><PSInput value="ko_KR.UTF-8" mono/></PSRow>
      <PSRow label="SSL mode"><PSInput value="verify-full · corp-ca-2024" readOnly mono/></PSRow>
    </PSCard>
  </>
);

const PSSchedule = () => (
  <>
    <PSHead title="Schedule" desc="Automated run windows and cutover."
      actions={<Btn kind="primary" size="sm">Save changes</Btn>}/>
    <PSCard title="Nightly rehearsal">
      <PSRow label="Enabled"><PSToggle on={true} label="Run every night"/></PSRow>
      <PSRow label="Start time"><PSInput value="01:00 KST" mono width={120}/></PSRow>
      <PSRow label="Max duration"><PSInput value="240" mono suffix="minutes" width={120}/></PSRow>
    </PSCard>
    <PSCard title="Cutover window">
      <PSRow label="Planned cutover"><PSInput value="2026-05-03 22:00 KST" mono/></PSRow>
      <PSRow label="Freeze period"><PSInput value="T-24h · read-only source" readOnly mono/></PSRow>
      <PSRow label="Rollback SLA"><PSInput value="15" mono suffix="minutes" width={120}/></PSRow>
    </PSCard>
  </>
);

const PSNotify = () => (
  <>
    <PSHead title="Notifications" desc="Where run events and alerts are delivered."
      actions={<Btn kind="primary" size="sm">Save changes</Btn>}/>
    <PSCard title="Slack">
      <PSRow label="Workspace"><PSInput value="ksinfo.slack.com" readOnly mono/></PSRow>
      <PSRow label="Channel"><PSInput value="#mig-kdb-core" mono/></PSRow>
      <PSRow label="On run start"><PSToggle on={false} label="Notify"/></PSRow>
      <PSRow label="On run complete"><PSToggle on={true} label="Notify"/></PSRow>
      <PSRow label="On error (severity ≥ error)"><PSToggle on={true} label="Notify"/></PSRow>
    </PSCard>
    <PSCard title="Email">
      <PSRow label="Recipients"><PSInput value="henry.oh@ksinfo.co.kr, jh.lee@kdb.co.kr" mono/></PSRow>
      <PSRow label="Digest"><PSInput value="daily · 08:00 KST" mono/></PSRow>
    </PSCard>
    <PSCard title="Webhook">
      <PSRow label="URL"><PSInput value="https://ops.kdb.internal/hooks/mig" mono/></PSRow>
      <PSRow label="Secret"><PSInput value="whsec_••••••••••••••" readOnly mono/></PSRow>
    </PSCard>
  </>
);

const PSAccess = () => {
  const rows = [
    ['Admin',         'Owner'],
    ['Minjae Park',   'Editor'],
    ['Sooyeon Kim',   'Editor'],
    ['Jihoon Lee',    'Reviewer'],
  ];
  return (
    <>
      <PSHead title="Access" desc="Local users granted access to this project. No email required — add members in Site settings."
        actions={<Btn kind="secondary" size="sm" icon={<Ic.plus/>}>Add member</Btn>}/>
      <div style={{ border: '1px solid var(--border)', borderRadius: 4, background:  'var(--panel)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead>
            <tr style={{ background: 'var(--panel-2)', color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              <th style={{ textAlign: 'left', padding: '7px 12px' }}>Username</th>
              <th style={{ textAlign: 'left', padding: '7px 12px' }}>Role on project</th>
              <th style={{ width: 40 }}/>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '5px 12px', fontWeight: 500, fontFamily: 'var(--mono)', fontSize: 11 }}>{r[0]}</td>
                <td style={{ padding: '5px 12px' }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono)', padding: '1px 7px', borderRadius: 8, background: 'var(--panel-2)', border: '1px solid var(--border)' }}>{r[1]}</span>
                </td>
                <td style={{ padding: '5px 8px', color: 'var(--text-3)', textAlign: 'center', cursor: 'pointer' }}>⋯</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const PSDanger = ({ project, onDelete, onDuplicate }) => {
  const [confirmText, setConfirmText] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const canDelete = confirmText === project.name;

  return (
    <>
      <PSHead title="Danger zone" desc="Destructive actions. All operations are logged to the audit trail."/>

      <div style={{ border: '1px solid #e6c6c6', borderRadius: 4, background:  'var(--panel)', marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0dada', background: '#fcf4f4', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7a1f1f' }}>Duplicate project</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
              Copy mapping rules, copybooks, and connection profile to a new project. Artifacts and logs are not copied.
            </div>
          </div>
          <Btn kind="secondary" size="sm" onClick={() => onDuplicate?.()}>Duplicate…</Btn>
        </div>

        <div style={{ padding: '10px 14px', background: '#fcf4f4', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7a1f1f' }}>Delete project</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
              Permanently removes mapping rules, execution logs, and generated artifacts. <b>This cannot be undone.</b>
            </div>
          </div>
          <Btn kind="secondary" size="sm" onClick={() => setShowConfirm(true)}
            style={{ borderColor: '#c75757', color: '#a12929' }}>Delete project…</Btn>
        </div>
      </div>

      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,30,50,.35)',
            display: 'grid', placeItems: 'center', zIndex: 2000,
          }}>
          <div onClick={e => e.stopPropagation()}
            style={{
              width: 460, background:  'var(--panel)',
              border: '1px solid var(--border)', borderRadius: 6,
              boxShadow: '0 20px 60px rgba(20,30,50,.25)',
              overflow: 'hidden',
            }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', background: '#fcf4f4' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#7a1f1f' }}>Delete “{project.name}”</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>
                This will permanently delete:
              </div>
              <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.7 }}>
                <li>{project.tables} table mapping{project.tables === 1 ? '' : 's'}</li>
                <li>all run logs, artifacts, and diff reports</li>
                <li>scheduled runs and webhook configuration</li>
              </ul>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 11.5, marginBottom: 6 }}>
                Type <code style={{ background: 'var(--panel-2)', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--mono)', fontSize: 11 }}>{project.name}</code> to confirm.
              </div>
              <input
                value={confirmText} onChange={e => setConfirmText(e.target.value)}
                placeholder={project.name}
                style={{
                  width: '100%', height: 28, padding: '0 10px',
                  border: `1px solid ${canDelete ? '#c75757' : 'var(--border)'}`, borderRadius: 3,
                  fontFamily: 'var(--mono)', fontSize: 12,
                }}/>
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--panel-2)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <Btn kind="secondary" size="sm" onClick={() => setShowConfirm(false)}>Cancel</Btn>
              <button
                disabled={!canDelete}
                onClick={() => { onDelete?.(); setShowConfirm(false); }}
                style={{
                  padding: '4px 14px', fontSize: 11.5, fontWeight: 500,
                  border: 'none', borderRadius: 3,
                  background: canDelete ? '#a12929' : '#d4b5b5',
                  color: '#fff',
                  cursor: canDelete ? 'pointer' : 'not-allowed',
                }}>Delete forever</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.ProjectSettings = ProjectSettings;
