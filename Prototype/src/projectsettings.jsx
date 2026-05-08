/* Project Settings tab — general, source/target, schedule, notifications, danger zone */

const ProjectSettings = ({ project, section: sectionProp, onSectionChange, onDelete, onDuplicate, onRename, onDdlChange, onTestConnection, onCredentialsChange, onSimulateFail, notifEnabled = true }) => {
  /* Section can be controlled (from top-bar badge deep-link) or internal. */
  const [localSection, setLocalSection] = React.useState('general');
  const section = sectionProp ?? localSection;
  const setSection = onSectionChange ?? setLocalSection;

  const sections = [
    { k: 'general',  l: 'General',        d: '프로젝트 이름·환경·생성일' },
    { k: 'source',   l: 'AS-IS',          d: 'AS-IS DDL · 추출 데이터 · 도구 내장 DB' },
    { k: 'target',   l: 'TO-BE',          d: '대상 DB · 인코딩 · 자격증명' },
    { k: 'schedule', l: 'Schedule',       d: '야간 리허설 · 컷오버 · 외부 트리거' },
    { k: 'notify',   l: 'Notifications',  d: '인앱 알림 이벤트 구독' },
    { k: 'danger',   l: 'Danger zone',    d: '프로젝트 삭제 등 위험 동작',   danger: true },
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
                background: active ? (s.danger ? 'var(--red-50)' : 'var(--navy-50)') : 'transparent',
                borderLeft: active ? `2px solid ${s.danger ? 'var(--red)' : 'var(--navy)'}` : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? (s.danger ? 'var(--red)' : 'var(--navy)') : (s.danger ? 'var(--red)' : 'var(--text)'),
              }}>{s.l}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 1 }}>{s.d}</div>
            </div>
          );
        })}
      </aside>

      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '18px 26px 40px' }}>
        {section === 'general'  && <PSGeneral  project={project} onRename={onRename}/>}
        {section === 'source'   && <PSSource   project={project} onDdlChange={onDdlChange}/>}
        {section === 'target'   && <PSTarget   project={project} onDdlChange={onDdlChange} onTestConnection={onTestConnection} onCredentialsChange={onCredentialsChange} onSimulateFail={onSimulateFail}/>}
        {section === 'schedule' && <PSSchedule project={project}/>}
        {section === 'notify'   && <PSNotify notifEnabled={notifEnabled}/>}
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
      <PSHead title="General" desc="이 프로젝트의 기본 메타정보."
        actions={<Btn kind="primary" size="sm" onClick={() => onRename?.(name)}>저장</Btn>}/>
      <PSCard>
        <PSRow label="프로젝트 이름"><PSInput value={name} onChange={setName}/></PSRow>
        <PSRow label="고객사" hint="이 프로젝트가 속한 사이트·도메인.">
          <PSInput value="KDB Bank · Core Banking" mono/>
        </PSRow>
        <PSRow label="환경 라벨" hint="대상 TO-BE DB 가 속한 환경 — dev / stg / prod.">
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
        <PSRow label="생성일"><PSInput value="2026-02-11 14:20 KST" readOnly mono/></PSRow>
      </PSCard>
    </>
  );
};

/* AS-IS 측은 더 이상 JDBC 직접 접속이 아니라 다음 흐름:
     운영팀 야간 추출 → CSV 도착 → 도구 내장 DuckDB staging 에 raw 적재 →
     ASIS DDL 과 컬럼·길이 비교 → 매핑 단계에서 변환.
   따라서 PSSource 는 3 카드 구조: ASIS DDL · CSV 파일 · Staging (DuckDB).
   host/port/user/password 같은 외부 DB 입력은 노출하지 않는다. */
const PSSource = ({ project, onDdlChange }) => {
  return (
    <>
      <PSHead title="AS-IS" desc="AS-IS DDL · 야간 추출 데이터 · 도구 내장 DB."/>

      <DdlCard
        title="AS-IS DDL"
        desc="AS-IS 시스템의 스키마. 매핑 탭의 컬럼 목록 기준이 됩니다."
        side="asis"
        current={project.ddl?.asis}
        onChange={(v) => onDdlChange?.('asis', v)}
      />

      <CsvSourceCard csv={project.csvSource}/>

      <StagingCard staging={project.staging} csv={project.csvSource}/>
    </>
  );
};

/* ─── Source files (CSV) ────────────────────────────────────────
   야간 추출 파일의 메타데이터 (filename, encoding, delimiter, recordLength,
   parseStatus, recordCount). 운영팀이 SFTP/배치로 떨어뜨려 놓는 파일을
   도구가 받아 파싱하는 시나리오. */
const CsvSourceCard = ({ csv }) => {
  if (!csv) {
    return (
      <div style={{
        border: '1px solid var(--amber)', borderRadius: 4,
        background: 'var(--amber-50)', marginBottom: 14,
        padding: '12px 14px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>AS-IS 추출 데이터 (CSV)</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
          추출 파일이 아직 등록되지 않았습니다. 운영팀의 야간 추출 파일 경로를 등록하면 도착 후 자동으로 파싱됩니다.
        </div>
      </div>
    );
  }
  const ps = csv.parseStatus;
  const tone = ps === 'ok' ? 'ok' : ps === 'failed' ? 'err' : ps === 'pending' ? 'warn' : 'queued';
  const label = ps === 'ok' ? '파싱 완료' : ps === 'failed' ? '파싱 실패' : ps === 'pending' ? '파싱 대기' : '미도착';
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 4,
      background: 'var(--panel)', marginBottom: 14,
    }}>
      <div style={{ padding: '10px 14px 9px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
            AS-IS 추출 데이터 (CSV)
            <StatusBadge tone={tone}>{label}</StatusBadge>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
            운영팀 야간 추출 파일. 도구가 받아 AS-IS DB 에 원본 그대로 적재합니다.
          </div>
        </div>
        <Btn kind="secondary" size="sm"
          title="새 추출 파일이 도착했을 때 다시 등록합니다.">
          파일 재업로드
        </Btn>
        <Btn kind="secondary" size="sm"
          title="인코딩·구분자·헤더 등 파싱 설정을 변경한 후 다시 파싱합니다. AS-IS DB 도 처음부터 다시 적재됩니다.">
          재파싱
        </Btn>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <PSRow label="파일명"><PSInput value={csv.filename || '—'} readOnly mono/></PSRow>
        <PSRow label="도착 시각"><PSInput value={csv.arrivedAt || '— (미도착)'} readOnly mono/></PSRow>
        <PSRow label="인코딩"><PSInput value={csv.encoding} readOnly mono/></PSRow>
        <PSRow label="구분자" hint={csv.delimiter === 'FB' ? '고정폭 (메인프레임)' : '텍스트 구분자'}>
          <PSInput value={csv.delimiter === 'FB' ? 'FB · 고정폭' : csv.delimiter === '\t' ? '\\t (Tab)' : csv.delimiter} readOnly mono width={180}/>
        </PSRow>
        {csv.delimiter === 'FB' && (
          <PSRow label="레코드 길이"><PSInput value={String(csv.recordLength || '—')} readOnly mono suffix="bytes" width={140}/></PSRow>
        )}
        <PSRow label="헤더 행 포함"><PSInput value={csv.hasHeader ? '있음' : '없음'} readOnly mono width={100}/></PSRow>
        {ps === 'ok' && csv.recordCount != null && (
          <PSRow label="레코드 수">
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
              {csv.recordCount.toLocaleString()} 행
            </span>
          </PSRow>
        )}
      </div>

      {ps === 'failed' && csv.parseError && (
        <div style={{
          margin: '0 14px 12px',
          border: '1px solid var(--red)', background: 'var(--red-50)',
          borderRadius: 3, padding: '8px 10px',
          fontSize: 11.5, color: 'var(--red)', fontFamily: 'var(--mono)',
        }}>
          파싱 오류 · {csv.parseError}
        </div>
      )}
    </div>
  );
};

/* ─── AS-IS DB (도구 내장) ──────────────────────────────────────
   추출된 CSV 를 raw 그대로 적재하는 도구 내장 DB (구현체: DuckDB).
   사용자 입장에서는 AS-IS DB 와 동일하게 다뤄지며, host/port 같은 외부
   인프라 설정은 노출되지 않는다. */
const StagingCard = ({ staging, csv }) => {
  if (!staging) {
    return (
      <div style={{
        border: '1px solid var(--border)', borderRadius: 4,
        background: 'var(--panel)', marginBottom: 14,
        padding: '12px 14px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3,
          display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>📦</span>
          AS-IS DB (도구 내장)
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          AS-IS DB 가 아직 초기화되지 않았습니다. 추출 데이터(CSV) 도착 후 자동으로 적재됩니다.
        </div>
      </div>
    );
  }
  const sm = staging.schemaMatch;
  const smTone = sm === 'ok' ? 'ok' : sm === 'mismatch' ? 'err' : 'warn';
  const smLabel = sm === 'ok' ? '스키마 일치' : sm === 'mismatch' ? '스키마 불일치' : '스키마 검증 대기';
  const loadedTone = staging.loaded ? 'ok' : 'queued';
  const loadedLabel = staging.loaded ? '적재 완료' : '미적재';
  const dr = staging.dbReady;
  const drTone = dr === 'ok' ? 'ok' : dr === 'failed' ? 'err' : 'queued';
  const drLabel = dr === 'ok' ? '접근 가능' : dr === 'failed' ? '접근 실패' : '접근 검증 대기';
  const canLoad = csv?.parseStatus === 'ok';
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 4,
      background: 'var(--panel)', marginBottom: 14,
    }}>
      <div style={{ padding: '10px 14px 9px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14 }}>📦</span>
            AS-IS DB (도구 내장)
            <StatusBadge tone={loadedTone}>{loadedLabel}</StatusBadge>
            <StatusBadge tone={drTone}>{drLabel}</StatusBadge>
            <StatusBadge tone={smTone}>{smLabel}</StatusBadge>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
            추출된 CSV 를 원본 그대로 적재하는 임베디드 DB — 호스트·자격증명 설정 없이 도구가 알아서 처리합니다.
          </div>
        </div>
        <Btn kind="secondary" size="sm" disabled={!canLoad} title={canLoad ? '' : 'CSV 파싱 완료 후 가능'}>CSV 재적재</Btn>
        <Btn kind="secondary" size="sm" disabled={!staging.loaded}
          title="DB 파일 열기·메타테이블 조회 무결성을 즉시 확인합니다 (Run 시작 시 자동 검증과 동일).">
          접근 가능 재검증
        </Btn>
        <Btn kind="secondary" size="sm" disabled={!staging.loaded}>스키마 보기</Btn>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <PSRow label="저장 경로"><PSInput value={staging.store || '—'} readOnly mono/></PSRow>
        <PSRow label="저장 용량">
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
            {formatBytes(staging.storeSizeBytes)}
          </span>
        </PSRow>
        <PSRow label="적재 테이블 수">
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
            {staging.tables ?? 0} 개
          </span>
        </PSRow>
        <PSRow label="적재 완료 시각"><PSInput value={staging.loadedAt || '—'} readOnly mono/></PSRow>
      </div>

      {dr === 'failed' && (
        <div style={{
          margin: '0 14px 8px',
          border: '1px solid var(--red)', background: 'var(--red-50)',
          borderRadius: 3, padding: '8px 10px',
          fontSize: 11.5, color: 'var(--red)', fontFamily: 'var(--mono)',
        }}>
          DB 파일 접근 실패 · {staging.dbReadyDetail || '손상·잠금·권한 확인 필요'}
        </div>
      )}

      {sm === 'mismatch' && staging.schemaMismatchDetail && (
        <div style={{
          margin: '0 14px 12px',
          border: '1px solid var(--red)', background: 'var(--red-50)',
          borderRadius: 3, padding: '8px 10px',
          fontSize: 11.5, color: 'var(--red)', fontFamily: 'var(--mono)',
        }}>
          스키마 불일치 · {staging.schemaMismatchDetail}
        </div>
      )}
    </div>
  );
};

/* Helper — bytes → human-readable. null/undefined 면 '—' 반환. */
const formatBytes = (n) => {
  if (n == null) return '—';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const PSTarget = ({ project, onDdlChange, onTestConnection, onCredentialsChange, onSimulateFail }) => {
  const conn = project.connections?.tobe;
  const testing = conn?.status === 'testing';
  return (
    <>
      <PSHead title="TO-BE" desc="이행 대상 데이터베이스."
        actions={
          <Btn kind="secondary" size="sm"
            disabled={testing}
            icon={testing ? <Ic.spinner/> : null}
            onClick={() => onTestConnection?.('tobe')}>
            {testing ? '연결 테스트 중…' : '연결 테스트'}
          </Btn>
        }/>
      <PSCard>
        <PSRow label="DB 종류"><PSInput value={project.tgt || 'PostgreSQL 15'} readOnly mono/></PSRow>
        <PSRow label="호스트"><PSInput value="pg-core-01.kdb.internal:5432" mono/></PSRow>
        <PSRow label="데이터베이스"><PSInput value="core_banking" mono/></PSRow>
        <PSRow label="스키마"><PSInput value="public" mono/></PSRow>
        <PSRow label="인코딩"><PSInput value="UTF-8" mono/></PSRow>
        <PSRow label="콜레이션"><PSInput value="ko_KR.UTF-8" mono/></PSRow>
        <PSRow label="SSL 모드"><PSInput value="verify-full · corp-ca-2024" readOnly mono/></PSRow>
      </PSCard>

      <ConnectionStatusCard connection={conn}
        onRetry={() => onTestConnection?.('tobe')}
        onSimulateFail={() => onSimulateFail?.('tobe')}/>

      <CredsCard connection={conn} onChange={(c) => onCredentialsChange?.('tobe', c)}/>

      <DdlCard
        title="TO-BE DDL"
        desc="대상 스키마. 매핑·DDL 산출물 생성의 기준이 됩니다."
        side="tobe"
        current={project.ddl?.tobe}
        onChange={(v) => onDdlChange?.('tobe', v)}
      />
    </>
  );
};

/* Status card rendered below the connection config + Test button. Shows the
   latest outcome (connected / failed / stale / untested / testing) with
   relevant metadata and a retry action when the last attempt failed. */
const ConnectionStatusCard = ({ connection, onRetry, onSimulateFail }) => {
  if (!connection) return null;
  const s = connection.status;
  const tone = s === 'ok' ? 'green' : s === 'failed' ? 'red' : s === 'testing' || s === 'stale' ? 'amber' : 'gray';
  const bg = tone === 'green' ? 'var(--green-50)' : tone === 'red' ? 'var(--red-50)' : tone === 'amber' ? 'var(--amber-50)' : 'var(--panel-2)';
  const bd = tone === 'green' ? 'var(--green)' : tone === 'red' ? 'var(--red)' : tone === 'amber' ? 'var(--amber)' : 'var(--border)';
  const fg = tone === 'green' ? 'var(--green)' : tone === 'red' ? 'var(--red)' : tone === 'amber' ? 'var(--amber)' : 'var(--text-3)';

  const label = s === 'ok' ? 'Connected' : s === 'failed' ? 'Connection failed' : s === 'testing' ? 'Testing…' : s === 'stale' ? 'Stale' : 'Not tested';

  return (
    <div style={{
      border: `1px solid ${bd}`, background: bg, borderRadius: 4,
      padding: '10px 14px', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: fg }}>
        {s === 'testing'
          ? <Ic.spinner/>
          : <span style={{ width: 8, height: 8, borderRadius: '50%', background: fg, display: 'inline-block' }}/>}
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
      </div>

      <div style={{ flex: 1, fontSize: 11.5, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
        {s === 'ok' && (
          <>latency {connection.latencyMs}ms · detected {connection.detectedTables ?? '—'} tables · last tested {connection.lastTestedAt}</>
        )}
        {s === 'failed' && <>{connection.error} · {connection.lastTestedAt}</>}
        {s === 'stale' && <>last tested {connection.lastTestedAt} — 연결이 최근에 검증되지 않았습니다</>}
        {s === 'untested' && <>아직 연결을 테스트하지 않았습니다. [Test connection] 으로 검증하세요.</>}
        {s === 'testing' && <>연결을 확인하는 중입니다…</>}
      </div>

      {s === 'failed' && (
        <Btn kind="secondary" size="sm" onClick={onRetry}>Retry</Btn>
      )}
      {(s === 'ok' || s === 'stale' || s === 'untested') && onSimulateFail && (
        <button onClick={onSimulateFail}
          title="데모용 — 실패 상태를 강제로 재현합니다"
          style={{
            border: 'none', background: 'transparent',
            color: 'var(--text-4)', cursor: 'pointer',
            fontSize: 10.5, fontFamily: 'var(--mono)',
            textDecoration: 'underline',
          }}>
          (demo) simulate fail
        </button>
      )}
    </div>
  );
};

/* Credentials card — separated from connection config so auth method /
   password rotation has its own lifecycle. Editing here updates the project
   state; for the prototype the password is never actually stored. */
const CredsCard = ({ connection, onChange }) => {
  const creds = connection?.credentials;
  const [showPw, setShowPw] = React.useState(false);
  const [editingPw, setEditingPw] = React.useState(false);
  const [newPw, setNewPw] = React.useState('');
  if (!creds) return null;
  const today = () => new Date().toISOString().slice(0, 10);

  const commitPw = () => {
    if (newPw) onChange?.({ ...creds, passwordSet: true, lastRotated: today() });
    setEditingPw(false); setNewPw('');
  };

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 4,
      background: 'var(--panel)', marginBottom: 14,
    }}>
      <div style={{ padding: '10px 14px 9px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Credentials</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
            로그인 정보와 인증 방식. 자격증명은 이 프로젝트에만 적용됩니다.
          </div>
        </div>
        <Btn kind="ghost" size="sm"
          onClick={() => onChange?.({ ...creds, lastRotated: today(), passwordSet: true })}>
          Rotate password
        </Btn>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <PSRow label="Username">
          <PSInput value={creds.username} onChange={(v) => onChange?.({ ...creds, username: v })} mono/>
        </PSRow>
        <PSRow label="Auth method">
          <select value={creds.authMethod}
            onChange={(e) => onChange?.({ ...creds, authMethod: e.target.value })}
            style={{
              height: 24, padding: '0 8px',
              border: '1px solid var(--border)', borderRadius: 3,
              background: 'var(--panel)', fontFamily: 'var(--mono)',
              fontSize: 11.5, color: 'var(--text)',
            }}>
            <option value="password">Password</option>
            <option value="kerberos">Kerberos</option>
            <option value="ssh_key">SSH key</option>
            <option value="cert">Certificate</option>
          </select>
        </PSRow>
        {creds.authMethod === 'password' && (
          <PSRow label="Password" hint={creds.passwordSet ? `last rotated ${creds.lastRotated}` : 'not set'}>
            {editingPw ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  autoFocus
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  onBlur={commitPw}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitPw();
                    if (e.key === 'Escape') { setEditingPw(false); setNewPw(''); }
                  }}
                  placeholder="new password"
                  style={{
                    flex: 1, height: 24, padding: '0 8px',
                    border: '1px solid var(--navy)', borderRadius: 3,
                    background: 'var(--panel)', fontFamily: 'var(--mono)',
                    fontSize: 11.5, color: 'var(--text)',
                  }}/>
                <button onClick={() => setShowPw(s => !s)} style={{
                  border: '1px solid var(--border)', background: 'var(--panel)',
                  color: 'var(--text-2)', cursor: 'pointer',
                  fontSize: 10.5, fontFamily: 'var(--mono)',
                  padding: '0 8px', height: 24, borderRadius: 3,
                }}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  flex: 1, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)',
                  padding: '3px 8px', background: 'var(--panel-2)',
                  border: '1px solid var(--border)', borderRadius: 3,
                }}>{creds.passwordSet ? (showPw ? '(mock) ops-pw-23f!' : '••••••••••') : <span style={{ color: 'var(--text-4)' }}>not set</span>}</span>
                <button onClick={() => setShowPw(s => !s)} style={{
                  border: '1px solid var(--border)', background: 'var(--panel)',
                  color: 'var(--text-2)', cursor: 'pointer',
                  fontSize: 10.5, fontFamily: 'var(--mono)',
                  padding: '0 8px', height: 24, borderRadius: 3,
                }}>{showPw ? 'Hide' : 'Show'}</button>
                <button onClick={() => { setEditingPw(true); setNewPw(''); setShowPw(false); }} style={{
                  border: 'none', background: 'transparent',
                  color: 'var(--navy)', cursor: 'pointer',
                  fontSize: 11, textDecoration: 'underline',
                }}>Change…</button>
              </div>
            )}
          </PSRow>
        )}
        {creds.authMethod === 'kerberos' && (
          <PSRow label="Principal"><PSInput value="app_ops@KDB.CORP" mono/></PSRow>
        )}
        {creds.authMethod === 'ssh_key' && (
          <PSRow label="Private key" hint="대화형 발급 흐름은 V1 예정">
            <PSInput value="~/.ssh/mig-ops.key" mono readOnly/>
          </PSRow>
        )}
        {creds.authMethod === 'cert' && (
          <PSRow label="Certificate"><PSInput value="/etc/mig/certs/app_ops.pem" mono readOnly/></PSRow>
        )}
      </div>
    </div>
  );
};

/* Reusable DDL upload card — used by Source and Target sections. */
const DdlCard = ({ title, desc, side, current, onChange }) => {
  const fileInputRef = React.useRef();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const handlePick = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    /* Prototype: fake the parse result based on file size. Real impl would
       parse DDL and return tables/columns counts. */
    const bytes = file.size;
    const fakeTables = Math.max(1, Math.floor(bytes / 1800));
    const fakeCols   = Math.max(1, Math.floor(bytes / 180));
    const now = new Date();
    const fmt = now.toISOString().slice(0, 16).replace('T', ' ');
    onChange?.({
      filename: file.name,
      uploadedAt: fmt,
      tables: fakeTables,
      columns: fakeCols,
    });
    ev.target.value = '';  // allow re-pick of same file
  };

  return (
    <div style={{
      border: `1px solid ${current ? 'var(--border)' : 'var(--amber)'}`,
      borderRadius: 4,
      background: current ? 'var(--panel)' : 'var(--amber-50)',
      marginBottom: 14,
    }}>
      <div style={{ padding: '10px 14px 9px', borderBottom: '1px solid var(--border)',
        background: current ? 'var(--panel)' : 'var(--amber-50)',
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
            {title}
            {current
              ? <StatusBadge tone="ok">imported</StatusBadge>
              : <StatusBadge tone="warn">not imported</StatusBadge>}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {current ? (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14,
              padding: '4px 0', borderBottom: '1px dashed var(--border)',
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 500 }}>Filename</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text)' }}>{current.filename}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, padding: '4px 0', borderBottom: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 500 }}>Imported at</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{current.uploadedAt}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, padding: '4px 0', borderBottom: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 500 }}>Detected</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                {current.tables} tables · {current.columns} columns
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="file" ref={fileInputRef} onChange={handlePick} style={{ display: 'none' }} accept=".sql,.ddl,.yaml,.yml,.txt"/>
              <Btn kind="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Re-upload</Btn>
              <Btn kind="secondary" size="sm">Preview schema</Btn>
              <div style={{ flex: 1 }}/>
              <Btn kind="danger" size="sm" onClick={() => setConfirmDelete(true)}>Delete DDL</Btn>
            </div>
          </>
        ) : (
          <div style={{
            padding: '14px 10px', textAlign: 'center',
            border: '1px dashed var(--border-strong)', borderRadius: 4,
            background: 'var(--panel)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
              No {side === 'asis' ? 'AS-IS' : 'TO-BE'} DDL imported yet
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 10 }}>
              Accepts .sql · .ddl · .yaml files
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePick} style={{ display: 'none' }} accept=".sql,.ddl,.yaml,.yml,.txt"/>
            <Btn kind="primary" size="sm" icon={<Ic.download/>} onClick={() => fileInputRef.current?.click()}>
              Choose DDL file
            </Btn>
          </div>
        )}
      </div>

      {confirmDelete && (
        <DdlDeleteConfirm
          title={title}
          filename={current?.filename || ''}
          side={side}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { onChange?.(null); setConfirmDelete(false); }}
        />
      )}
    </div>
  );
};

const DdlDeleteConfirm = ({ title, filename, side, onCancel, onConfirm }) => (
  <div onClick={onCancel} style={{
    position: 'fixed', inset: 0, background: 'rgba(20,30,50,.35)',
    display: 'grid', placeItems: 'center', zIndex: 2000,
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      width: 460, background: 'var(--panel)',
      border: '1px solid var(--border)', borderRadius: 6,
      boxShadow: '0 20px 60px rgba(20,30,50,.25)', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', background: 'var(--red-50)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Delete {title}?</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>
          {side === 'asis'
            ? 'AS-IS 스키마를 지우면 이 프로젝트의 매핑 정의와 컬럼 연결이 끊어집니다.'
            : 'TO-BE 스키마를 지우면 DDL 산출물 생성과 검증 리포트가 중단됩니다.'}
        </div>
      </div>
      <div style={{ padding: '14px 18px', fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
        <div style={{ fontFamily: 'var(--mono)', background: 'var(--panel-2)', padding: '6px 10px', borderRadius: 3 }}>
          {filename || '(unnamed)'}
        </div>
        <div style={{ marginTop: 10 }}>
          DDL 파일을 다시 업로드하면 복원할 수 있지만, 그 사이에 편집한 매핑 규칙은 덮어씌워질 수 있습니다.
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--panel-2)',
        display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <Btn kind="secondary" size="sm" onClick={onCancel}>Cancel</Btn>
        <button onClick={onConfirm} style={{
          padding: '4px 14px', fontSize: 11.5, fontWeight: 500,
          border: 'none', borderRadius: 3,
          background: 'var(--red)', color: '#fff', cursor: 'pointer',
        }}>Delete DDL</button>
      </div>
    </div>
  </div>
);

const PSSchedule = ({ project }) => {
  const cut = project?.cutover || { dday: 'TBD', freezeHours: 24, rollbackSla: 15 };
  const pid = project?.id || 'p1';
  const [rehearsalOn, setRehearsalOn] = React.useState(true);
  const [startTime, setStartTime] = React.useState('22:00 KST');
  const [maxDuration, setMaxDuration] = React.useState('240');
  const [extTriggerOpen, setExtTriggerOpen] = React.useState(false);
  return (
    <>
      <PSHead title="Schedule" desc="Nightly rehearsal 자동 실행 · 컷오버 D-day · 외부 스케줄러 연동 옵션"
        actions={<Btn kind="primary" size="sm">Save changes</Btn>}/>

      {/* Nightly rehearsal — internal scheduler */}
      <PSCard title="Nightly rehearsal" desc="매일 정해진 시각에 dry-run rehearsal 을 자동 실행합니다. Control-M 같은 외부 스케줄러가 있는 환경에서는 비활성화하고 CLI 트리거를 쓰세요.">
        <PSRow label="Enabled" hint={rehearsalOn ? '활성화됨 — 매일 밤 자동 실행' : '비활성화 — 수동 또는 외부 스케줄러가 트리거'}>
          <PSToggle on={rehearsalOn} onChange={setRehearsalOn} label={rehearsalOn ? 'Run every night' : 'Paused'}/>
        </PSRow>
        <PSRow label="Start time" hint="타임존은 사이트 설정 기준">
          <PSInput value={startTime} onChange={setStartTime} mono width={140}/>
        </PSRow>
        <PSRow label="Max duration" hint="초과 시 자동 abort">
          <PSInput value={maxDuration} onChange={setMaxDuration} mono suffix="minutes" width={120}/>
        </PSRow>
        <PSRow label="Next scheduled">
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5,
            color: rehearsalOn ? 'var(--text-2)' : 'var(--text-4)' }}>
            {rehearsalOn ? '2026-04-25 ' + startTime : '— (disabled)'}
          </span>
        </PSRow>
      </PSCard>

      {/* Cutover window */}
      <PSCard title="Cutover window" desc="고객과 합의된 D-day 및 관련 시간 창.">
        <PSRow label="Planned cutover" hint="이행 실제 실행 일시 (본운영 전환)">
          <PSInput value={cut.dday} mono/>
        </PSRow>
        <PSRow label="Freeze start (T-N hours)" hint="소스 DB 가 read-only 로 전환되는 시점">
          <PSInput value={String(cut.freezeHours)} mono suffix="hours" width={120}/>
        </PSRow>
        <PSRow label="Rollback SLA" hint="컷오버 실패 판단 후 구 시스템 복구 완료까지 허용 시간">
          <PSInput value={String(cut.rollbackSla)} mono suffix="minutes" width={120}/>
        </PSRow>
      </PSCard>

      {/* External trigger — optional / advanced */}
      <div style={{
        border: '1px solid var(--border)', borderRadius: 4,
        background: 'var(--panel)', marginBottom: 14, overflow: 'hidden',
      }}>
        <div onClick={() => setExtTriggerOpen(o => !o)} style={{
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer',
          borderBottom: extTriggerOpen ? '1px solid var(--border)' : 'none',
          background: extTriggerOpen ? 'var(--panel-2)' : 'var(--panel)',
        }}>
          <span style={{ color: 'var(--text-4)', fontSize: 10, width: 10 }}>{extTriggerOpen ? '▾' : '▸'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>External trigger (선택)</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
              Control-M · Jenkins · Airflow 등 기존 사내 스케줄러에서 이 프로젝트를 트리거하는 방법
            </div>
          </div>
          <StatusBadge tone="queued">optional</StatusBadge>
        </div>
        {extTriggerOpen && (
          <div style={{ padding: '12px 14px' }}>
            {/* Hard prerequisite — explain where to enable + what happens if not */}
            <div style={{
              padding: 10, marginBottom: 10,
              border: '1px solid var(--amber)', background: 'var(--amber-50)',
              borderRadius: 3, fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>⚠ 사전 조건 — Solution Settings 에서 활성화 필요</div>
              External trigger 는 솔루션 전역 기능이라 <b>Solution Settings › External integrations</b> 에서 먼저 토글을 켜야 동작합니다. 켜지 않으면 CLI / API endpoint 가 응답하지 않습니다.
              <br/>
              그리고 위 <b>Nightly rehearsal</b> 과 동시 사용 금지 — 둘 다 켜면 같은 시각에 중복 실행될 수 있습니다. 외부 스케줄러로 옮기면 Nightly rehearsal 은 끄세요.
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 8 }}>
              아래 명령을 외부 스케줄러(Control-M · Airflow · Jenkins · cron)에 등록하면 됩니다.
            </div>
            <div style={{
              padding: 10, background: '#0e1a2b', color: '#cad7e8',
              fontFamily: 'var(--mono)', fontSize: 11, borderRadius: 3, lineHeight: 1.6,
            }}>
              <div><span style={{ color: '#7a8aa6' }}># 야간 rehearsal (dry-run · TEST 타겟)</span></div>
              <div><span style={{ color: '#e8b86f' }}>migrate</span> run --project <span style={{ color: '#9fd9b3' }}>{pid}</span> --mode <span style={{ color: '#9fd9b3' }}>rehearsal</span> --dry-run</div>
              <div style={{ marginTop: 6 }}><span style={{ color: '#7a8aa6' }}># 컷오버 (운영 타겟 · 승인된 스냅샷 필요)</span></div>
              <div><span style={{ color: '#e8b86f' }}>migrate</span> run --project <span style={{ color: '#9fd9b3' }}>{pid}</span> --mode <span style={{ color: '#9fd9b3' }}>cutover</span></div>
              <div style={{ marginTop: 6 }}><span style={{ color: '#7a8aa6' }}># 롤백</span></div>
              <div><span style={{ color: '#e8b86f' }}>migrate</span> rollback --project <span style={{ color: '#9fd9b3' }}>{pid}</span> --to <span style={{ color: '#9fd9b3' }}>pre-cutover</span></div>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 8 }}>
              CLI 경로 · API endpoint · API token 은 <b>Solution Settings › External integrations</b> 에서 관리합니다.
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const PSNotify = ({ notifEnabled = true }) => {
  const events = window.NOTIFICATION_EVENTS || [];
  /* All events on by default. Real tool persists per-user prefs server-side. */
  const [subs, setSubs] = React.useState(() => {
    const o = {}; events.forEach(e => { o[e.k] = true; }); return o;
  });
  const toggle = (k) => notifEnabled && setSubs(s => ({ ...s, [k]: !s[k] }));

  return (
    <>
      <PSHead title="Notifications" desc="In-app inbox · 닫힌 네트워크에서는 유일한 기본 채널입니다."
        actions={<Btn kind="primary" size="sm" disabled={!notifEnabled}>Save changes</Btn>}/>

      {/* Master toggle off — 안내 배너 (정책 우선) */}
      {!notifEnabled ? (
        <div style={{
          padding: '12px 14px', marginBottom: 14,
          border: '1px solid var(--amber)', background: 'var(--amber-50)',
          borderRadius: 4, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>
            🔕 알림이 솔루션 전역에서 비활성화 상태입니다
          </div>
          현재 <b>Solution Settings › Notifications</b> 의 마스터 스위치가 off 입니다. 본 화면의 이벤트 구독은 일시적으로 잠겨 있으며, Solution Settings 에서 알림을 다시 켜야 적용됩니다.
        </div>
      ) : (
        <div style={{
          padding: '10px 14px', marginBottom: 14,
          border: '1px solid var(--border)', borderRadius: 4,
          background: 'var(--panel-2)',
          fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>📬 In-app notification inbox</div>
          외부 Slack / Email / Webhook 은 폐쇄망에서는 쓸 수 없으므로, 모든 알림은 상단의
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 4px',
            padding: '1px 6px', border: '1px solid var(--border-strong)', borderRadius: 3,
            fontFamily: 'var(--mono)', fontSize: 10.5 }}>🔔 Bell</span>
          아이콘을 통해 수신됩니다.
        </div>
      )}

      <div style={{
        opacity: notifEnabled ? 1 : 0.45,
        pointerEvents: notifEnabled ? 'auto' : 'none',
        transition: 'opacity .15s',
      }}>
        <PSCard title="이벤트 구독" desc="알림으로 받을 이벤트를 선택합니다.">
          {events.map((e, i) => (
            <div key={e.k} style={{
              display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 14,
              padding: '8px 0',
              borderBottom: i < events.length - 1 ? '1px dashed var(--border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{e.l}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{e.desc}</div>
              </div>
              <PSToggle on={notifEnabled && subs[e.k]} onChange={() => toggle(e.k)} label=""/>
            </div>
          ))}
        </PSCard>

        <PSCard title="수신자 옵션" desc="이 프로젝트에 관한 알림을 받는 범위.">
          <PSRow label="Scope" hint="본인이 관여한 활동만 받을지, 프로젝트 전체 이벤트를 받을지">
            <div style={{ display: 'flex', gap: 5 }}>
              {['mine-only', 'all-project'].map(k => {
                const active = k === 'all-project';
                return (
                  <button key={k} style={{
                    padding: '3px 12px', fontSize: 11, fontFamily: 'var(--mono)',
                    border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
                    background: active ? 'var(--navy)' : 'var(--panel)',
                    color: active ? '#fff' : 'var(--text-2)',
                    borderRadius: 3, cursor: 'pointer',
                  }}>{k === 'mine-only' ? 'My activity only' : 'All project events'}</button>
                );
              })}
            </div>
          </PSRow>
          <PSRow label="Retention" hint="알림이 inbox 에 유지되는 기간">
            <PSInput value="90 days" mono width={160}/>
          </PSRow>
        </PSCard>
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
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--red)', background: 'var(--red-50)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>Duplicate project</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
              Copy mapping rules, copybooks, and connection profile to a new project. Artifacts and logs are not copied.
            </div>
          </div>
          <Btn kind="secondary" size="sm" onClick={() => onDuplicate?.()}>Duplicate…</Btn>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--red-50)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>Delete project</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
              Permanently removes mapping rules, execution logs, and generated artifacts. <b>This cannot be undone.</b>
            </div>
          </div>
          <Btn kind="secondary" size="sm" onClick={() => setShowConfirm(true)}
            style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>Delete project…</Btn>
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
            <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', background: 'var(--red-50)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Delete “{project.name}”</div>
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
                  border: `1px solid ${canDelete ? 'var(--red)' : 'var(--border)'}`, borderRadius: 3,
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
                  background: canDelete ? 'var(--red)' : 'var(--border-strong)',
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
