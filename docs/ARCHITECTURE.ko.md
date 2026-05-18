# ModernizeProData — 아키텍처 문서

작성일: 2026-05-12
대상: 개발팀 (BE: 임지영·배성민·오현호 / FE: 恩田·진수현)

---

## 1. 개요

### 1.1 도구 소개

**ModernizeProData** 는 대형 금융권의 데이터베이스 이행(Migration) 을 지원하는 도구. AS-IS 운영 시스템의 데이터를 TO-BE 신 시스템으로 정확하고 빠르게 옮기는 것이 목적.

### 1.2 데이터 이행의 과제

- **대용량** — TB 단위를 짧은 cutover 윈도우에 처리
- **복잡 변환** — 1:N, N:N 같은 테이블 구조 재구성
- **정확성** — 한 row 누락도 운영 사고
- **폐쇄망 제약** — 외부 서비스·도구 사용 불가
- **협업** — N명이 매핑·실행 분담 필요

ModernizeProData 는 폐쇄망에서 단일 설치 패키지로 동작하며, N대 PC가 협업해 운영할 수 있도록 설계.

### 1.3 1차 목표

- **대상 사이트**: 일본 금융권 특정 고객 (5월 31일 마감)
- **AS-IS DB**: Oracle
- **TO-BE DB**: PostgreSQL

이후 확장: 다양한 AS-IS·TO-BE RDBMS 지원 (Db2, Symfoware 등)

### 1.4 핵심 가정

1. **폐쇄망 운영** — 외부 통신 0건, LAN 내부에서만 동작
2. **N대 PC 분산** — 최소 2대, 상한 없음. Coordinator 1 + Worker N
3. **당일 단일 실행** — 운영 일정 협의 영역은 제외
4. **AS-IS 입수 = CSV 파일** — 도구가 운영 DB 에 직접 접속하지 않음
5. **Coordinator = Master** — 매핑·실행·운영·인증 단일 거점
6. **로그인 인증** — Coordinator 발급 ID/비번/역할로 각 Worker 자리에서 로그인
7. **매핑 협업 = 실시간 공유 편집** — 자동 lock + master 관리 lock + audit log
8. **기술 스택** — Java (Spring Boot + Spring Batch) + DuckDB + React + TypeScript

### 1.5 문서 범위

- 개발 일정
- 환경 (개발·배포)
- 시스템 구조
- 데이터 흐름
- 기능 (매핑·실행·검증·격리·사용자 관리 등)
- 첫 테스트 시나리오
- 고객 협의 사항

---

## 2. 개발 일정

### 2.1 일정 개요

- **시작**: 2026-05-12
- **1차 마감**: 2026-05-31
- **가용 기간**: 약 19일 (작업일 14)

### 2.2 가정·전제

- **팀 인원**: 5명
  - BE: 임지영, 배성민, 오현호
  - FE: 恩田, 진수현
- **5/31 목표**: PoC 가능 수준의 툴 완성
- **1차 시나리오**: Oracle → PostgreSQL
- **PoC 시나리오**: 고객 협의 영역 (개발은 일반 가정으로 진행)
- **인코딩**: Shift JIS → UTF-8 (1차)

### 2.3 단계별 마일스톤

#### Week 1 (5/12 ~ 5/18) — 기반 구축
- Project skeleton (Spring Boot + Spring Batch + React + Vite + TypeScript)
- Multi-module 구조 (coordinator / worker / common / ui)
- 개발자 로컬 DB 환경 (Docker 또는 로컬 설치)
- DuckDB 변환 prototype (Java 임베디드 동작 확인)
- React UI 셋업 (현 prototype 이식)
- LAN REST + WebSocket 골격
- 인코딩 변환 prototype (Shift JIS → UTF-8)
- Extract 변환 prototype (COMP → Numeric)

#### Week 2 (5/19 ~ 5/25) — 핵심 기능
- 매핑 정의 관리 (CRUD + 테이블 lock + audit log)
- 매핑 스냅샷 (버전 관리)
- 사용자·역할 관리 + JWT 로그인
- Run 실행 (Spring Batch + DuckDB 호출)
- 스케줄러 (예약 실행 — Quartz, cron 기반)
- TO-BE 적재 (PostgreSQL JDBC + COPY FROM)
- 검증 (DuckDB cross-source SQL)
- 진행 모니터링 UI (WebSocket 실시간)
- 알림 시스템 기반 (WebSocket push + 메타 DB 저장)
- 인코딩·Extract 변환 안정화

#### Week 3 (5/26 ~ 5/31) — 통합 + 첫 테스트
- Coordinator + Worker 분리·통신 안정화
- 격리(Quarantine) 처리 + UI
- 로그 뷰 UI (필터·검색·export)
- 알림 센터 UI (필터·구독·읽음 관리)
- 산출물 출력 (검증 리포트 / 매핑 스냅샷 export / audit log export)
- 폐쇄망 패키징 (jpackage 단일 인스톨러)
- 라이선스 (.lic) 검증
- 첫 PoC 테스트 시나리오 (일반 가정 기반)
- 버그 수정·안정화

### 2.4 리스크

- 일정 매우 빡빡 → 우선순위 외 기능은 후속
- 폐쇄망 패키징 첫 경험 부담
- PoC 시나리오 정보 부재 → 개발 중 가정으로 진행

---

## 3. 환경

### 3.1 백엔드 개발 환경

**기본:**
- JDK 21 (LTS)
- VSCode 또는 Cursor
- Maven
- Git

**로컬 DB (개발용):**
- PostgreSQL (Docker 또는 로컬 설치) — TO-BE 흉내내기
- Oracle XE (Docker 또는 로컬 설치) — AS-IS 흉내내기

**빌드·패키징:**
- jpackage (JRE 21 bundle 단일 native installer)

### 3.2 프론트엔드 개발 환경

**기본:**
- Node.js 20 (LTS)
- npm
- VSCode 또는 Cursor

**프레임워크·언어:**
- React 18+
- TypeScript 5+
- Vite (빌드)

### 3.3 Front ↔ Back 통신

**REST API:**
- 매핑 CRUD, run 실행, 사용자 인증, 검증 결과 조회 등
- JSON 직렬화 (Jackson)

**WebSocket:**
- 실시간 진행상황 (적재·변환 %)
- Lock 상태 변경 알림
- 시스템 알림 (격리·에러)

**인증:**
- JWT 토큰 (로그인 시 발급)
- 매 요청 `Authorization: Bearer <token>` 헤더

### 3.4 사이트 배포 환경

**구성:**
- Coordinator 1대 (Worker 한 대 겸용 가능)
- Worker N대 (최소 2대, 상한 없음)

**하드웨어 권장 (Worker 기준):**
- CPU: 8 core 이상
- RAM: 16GB 이상
- 디스크: 작업 데이터 + 여유 (SSD 권장)

**네트워크:**
- LAN 1Gbps 이상
- 방화벽: Coordinator port (예: 8080) 사내 접근 허가
- 외부 인터넷 0건

**OS:** Windows Server

**배포 형태:**
- jpackage 산출물 `.exe` 또는 `.msi` 단일 인스톨러
- JRE 21 + JAR + JDBC driver + .lic 포함
- USB 운반

### 3.5 필수 라이브러리

**백엔드 (Spring Boot):**
```
spring-boot-starter-web          REST API
spring-boot-starter-batch        chunk-oriented ETL
spring-boot-starter-websocket    실시간 통신
spring-boot-starter-security     JWT 인증
spring-boot-starter-data-jpa     또는 jdbc
spring-boot-starter-quartz       스케줄러
duckdb_jdbc                      DuckDB 임베디드
ojdbc11                          Oracle JDBC
postgresql                       PostgreSQL JDBC
slf4j + logback                  로깅
jackson                          JSON
```

**프론트엔드 (npm):**
```
react@18, react-dom@18
typescript@5
vite + @vitejs/plugin-react
axios                            HTTP 클라이언트
@tanstack/react-query            server state
zustand                          client state (선택)
sockjs-client + stompjs          WebSocket (STOMP)
```

---

## 4. 시스템 구조

### 4.1 전체 구성도

```
[ 사이트 폐쇄망 LAN ]

  ┌──────────────────────────────────────────────────┐
  │ Coordinator PC (1대)                              │
  │  ┌─────────────────────────────────────────────┐ │
  │  │ ModernizeProData.exe (네이티브 앱)            │ │
  │  │  - 네이티브 창 + React UI (webview 내장)     │ │
  │  │  - Spring Boot (같은 프로세스)               │ │
  │  │  - DuckDB (임베디드)                         │ │
  │  │  - 메타 DB (H2 또는 SQLite)                  │ │
  │  │  - 스케줄러 (Quartz, 임베디드)               │ │
  │  │  - .lic 검증                                 │ │
  │  │                                              │ │
  │  │  master 역할: 매핑·사용자·진행 관리,           │ │
  │  │              작업 분배, 예약 실행 관리        │ │
  │  │  worker 역할: 추출·변환·적재·검증 (병행)      │ │
  │  └─────────────────────────────────────────────┘ │
  │                    │                             │
  │           LAN REST + WebSocket                   │
  │  ┌────────┬───────┴────┬────────┐                │
  │  │        │            │        │                │
  │ [W1]   [W2]         [W3]   ...                   │
  │  Worker PC (N-1대)                               │
  │  - ModernizeProData.exe (같은 앱, worker 모드)    │
  │  - Spring Boot + DuckDB 임베디드                 │
  │  - 추출·변환·적재·검증                            │
  └──────────────────────────────────────────────────┘
                  │              │
        [ AS-IS CSV 파일 ]  [ TO-BE RDBMS ]
        (각 PC 디스크         (사이트별: 1차 PostgreSQL)
         또는 공유 폴더)

  각 PC 디스크 내부:
   - AS-IS CSV (입력)
   - Parquet 임시 (DuckDB 변환 결과, 적재 후 삭제)
```

### 4.2 컴포넌트별 책임

| 컴포넌트 | 책임 | 위치 |
|---|---|---|
| **Coordinator** | master 역할: 매핑·사용자·진행상황·라이선스 관리, UI 호스팅, 작업 분배, 예약 실행 관리 / worker 역할: 추출·변환·적재·검증 | LAN PC 1대 |
| **Worker** | worker 역할만: 추출·변환·적재·검증 | LAN PC N-1대 |
| **DuckDB** | 변환·검증 SQL 엔진 | Coordinator + Worker 모두 임베디드 |
| **스케줄러 (Quartz)** | 예약 실행 (일회성·반복), 작업 시간 트리거 | Coordinator 안 임베디드 |
| **메타 DB** | 매핑 정의·audit log·사용자 정보·스케줄·알림 | Coordinator 안 (H2 또는 SQLite) |
| **AS-IS CSV** | 입력 데이터 | 각 PC 디스크 또는 공유 폴더 |
| **Parquet (임시)** | DuckDB 변환 결과, 적재 후 삭제 | 각 Worker 디스크 |
| **TO-BE RDBMS** | 최종 적재 대상 | 사이트별 (1차: PostgreSQL) |

### 4.3 통신

**앱 내부 (UI ↔ 로컬 백엔드):**
- React UI ↔ 같은 프로세스의 Spring Boot (localhost)
- REST + WebSocket
- WebSocket 채널: 실시간 진행상황, Lock 변경, 알림

**Coordinator ↔ Worker (LAN):**
- REST API: Worker 등록·heartbeat, 작업 큐 polling, 결과 보고, 매핑·설정 조회
- WebSocket: 진행상황 push, Lock 변경, 알림 push

**Worker ↔ DB:**
- AS-IS: 파일 시스템 read (CSV)
- TO-BE: JDBC + COPY FROM (1차 PostgreSQL)

### 4.4 인증·권한

**라이선스 (.lic):**
- Coordinator 만 사용. Worker 는 .lic 없음
- 본사 발급, Ed25519 서명
- Coordinator 기동 시 검증
- 사이트 ID 바인딩

**사용자 인증:**
- Coordinator (master) 에서 ID·이름·비밀번호·역할 발급
- ID 만료일 지정 가능 (선택, master 가 연장 가능)
- 로그인 시 JWT 토큰 발급 (예: 8시간 유효)
- 매 요청에 `Authorization: Bearer <token>`

**역할:**

| 역할 | 권한 |
|---|---|
| master | 전체 관리. 사용자 생성·삭제·연장, 라이선스, 매핑 관리, 실행, 모든 데이터 조회 |
| admin | 매핑 작성·실행, 격리 처리, 데이터 조회. 사용자 관리 권한 없음 |
| viewer | 조회만 (매핑·진행·로그) |

위치(Coordinator/Worker) 와 무관 — 권한 등급. master 사용자가 Worker 자리에서 로그인해도 동일한 master 권한.

**Worker 등록:**
- Worker 앱 기동 시 Coordinator URL 로 자동 등록 요청
- Coordinator 가 워커 등록 토큰 발급 (사용자 JWT 와 별도)
- 매 호출에 토큰 사용

**ID → 토큰 흐름:**
```
1. master 가 Coordinator 에서 ID·비번·역할·만료일 생성
2. 사용자가 Worker PC 의 ModernizeProData.exe 실행
3. 앱 창에서 ID·비번 입력 → 로그인 시도
4. Coordinator 가 검증 (비번 OK + ID 만료 안 됨)
5. JWT 토큰 발급 (8시간 유효)
6. 토큰으로 UI 사용
7. 토큰 만료 시 재로그인 또는 자동 갱신
```

---

## 5. 데이터 흐름

### 5.1 전체 흐름

```
[ AS-IS 추출 데이터 ]
  (UTF-8 / Shift JIS / EUC-JP / EBCDIC / COMP 등)
         │
         ↓ [선택] Java 전처리
         │   - 표준 인코딩 (Shift JIS 등): 생략
         │   - 비표준 (EBCDIC, COMP/PACKED): Java 변환
         ↓
[ DuckDB-readable CSV ]
         │
         ↓ DuckDB SQL 변환 (매핑 정의 기반)
[ Parquet (UTF-8) ]
         │
         ↓ Java COPY FROM (JDBC + CopyManager)
         │   - Target 인코딩 (UTF-8/SJIS) 자동 변환
[ TO-BE 테이블 ]
         │
         ↓ DuckDB 검증 (cross-source SQL)
[ 검증 통과 / 실패 → Quarantine ]
```

### 5.2 단계 요약

| 단계 | 입력 | 출력 | 처리 도구 |
|---|---|---|---|
| 1. 입력 수령 | (운영팀 추출) | Raw 데이터 | — |
| 2. 전처리 (선택) | Raw | DuckDB-readable CSV | Java (비표준 인코딩·binary 만) |
| 3. 변환 | CSV | Parquet (UTF-8) | DuckDB SQL |
| 4. 적재 | Parquet | TO-BE 테이블 | Java + JDBC COPY |
| 5. 검증 | CSV + TO-BE | 통과/실패 리포트 | DuckDB cross-source |
| 6. 격리 | 실패 row | Quarantine 보관 | Java + 메타 DB |

### 5.3 단계별 상세

#### 5.3.1 입력 수령
- 운영팀이 AS-IS 시스템에서 추출한 데이터를 폐쇄망 안 디스크 (Worker 디스크 또는 공유 폴더) 에 둠
- 도구는 운영 DB 직접 접속 안 함

#### 5.3.2 전처리 (선택적)

매핑 정의의 source encoding/형식 에 따라 분기:

| 케이스 | 처리 |
|---|---|
| 표준 텍스트 인코딩 (UTF-8/SJIS/EUC-JP 등) | 생략 — DuckDB 가 `encodings` extension 으로 직접 처리 |
| 비표준 인코딩 (EBCDIC variant — IBM037/IBM930/JEF/KEIS) | Java Charset 으로 변환 |
| Binary 필드 (COMP/PACKED/ZONED) | Java parser 로 numeric 변환 |

#### 5.3.3 변환 (DuckDB SQL)

- 매핑 정의 = DuckDB SQL (단순 1:1 도, 복잡 N:N 도 같은 형식)
- DuckDB 가 CSV 를 그 자리에서 쿼리 (인코딩 옵션 사용)
- 결과를 항상 Parquet 으로 출력

```sql
COPY (
  SELECT a.id, a.name, b.amount
  FROM read_csv('asis_a.csv', encoding='shift_jis') a
  JOIN read_csv('asis_b.csv', encoding='shift_jis') b ON a.id = b.id
) TO 'output.parquet' (FORMAT PARQUET);
```

#### 5.3.4 적재 (Java + JDBC)

- Java 가 Parquet 읽어 TO-BE 에 COPY FROM (binary)
- Target 인코딩 처리:
  - TO-BE = UTF-8 → 그대로
  - TO-BE = SJIS → JDBC `client_encoding` 또는 DB encoding 설정으로 자동 변환
- Spring Batch chunk-oriented (예: 10000 row 단위 commit)
- 적재 전 인덱스 drop / 후 재생성 (속도)

#### 5.3.5 검증 (DuckDB cross-source)

DuckDB 가 AS-IS CSV + TO-BE 양쪽을 한 쿼리로 비교:

```sql
-- 합계 비교
SELECT
  (SELECT SUM(amount) FROM 'asis_clean.csv') AS asis_sum,
  (SELECT SUM(amount) FROM pg.tobe_table)    AS tobe_sum;

-- 불일치 row 찾기
SELECT a.id, a.amount AS src, b.amount AS dst
FROM 'asis_clean.csv' a
JOIN pg.tobe_table b ON a.id = b.id
WHERE a.amount <> b.amount;
```

검증 항목:
- 행수 비교
- 주요 컬럼 합계 비교
- Sample row 1:1 비교
- 인코딩 round-trip 불가 문자 검출

#### 5.3.6 격리 (Quarantine)

- 검증 실패 row 를 Coordinator 메타 DB 의 quarantine 테이블에 보관
- UI 에서 운영자 확인
- 매핑 수정 → 재변환·재적재·재검증 흐름

### 5.4 인코딩 처리 정리

| 케이스 | 처리 |
|---|---|
| 표준 텍스트 (UTF-8/SJIS/EUC-JP 등) | DuckDB 직접 (encodings ext.) |
| Binary (COMP/PACKED/ZONED) | Java 전처리 |
| EBCDIC variant | Java 전처리 (Charset.forName) |
| Target SJIS | PostgreSQL DB encoding 또는 JDBC client_encoding |
| Round-trip 불가 문자 | Quarantine |

도구가 매핑 정의에서 source encoding + target encoding 둘 다 지정 가능.

### 5.5 병렬 처리

**테이블 단위 (Worker 간 병렬):**
- Coordinator 가 테이블 목록을 N대 Worker 에 분배
- 각 Worker 는 자기 할당 테이블만 처리

**청크 단위 (한 테이블 내 병렬):**
- Spring Batch chunk 단위 (예: 10000 row)
- 적재 실패 시 마지막 commit 청크부터 재시작

### 5.6 실패 처리

- **Worker 다운**: Heartbeat 끊김 → 미완료 작업 다른 Worker 에 재할당. 부분 적재는 truncate / rollback
- **검증 실패**: 격리 기록 → 운영자 확인 → 매핑 수정 → 해당 테이블만 재실행

---

## 6. 기능

각 기능은 UI + Backend API 둘 다 갖춤. 권한 (role) 에 따라 접근 제한.

### 6.1 매핑 관리

**매핑 정의:**
- CRUD (생성·조회·수정·삭제)
- 상태 관리: draft / review / approved
- 인코딩 옵션 (source / target encoding)
- 필드 변환 옵션 (COMP → Numeric 등)

**Lock 기능:**
- 자동 lock — 매핑 편집 시 해당 테이블 자동 lock (동시 편집 방지). admin·master 만 발생
- 관리 lock (master 전용):
  - 테이블 단위 명시 lock
  - 업무 단위 명시 lock (여러 테이블 한 번에)

**스냅샷 (버전 관리):**
- 생성: master · admin
- Rollback: master · admin
- Approve (공식 승인): master 만

**권한 요약:**

| 작업 | master | admin | viewer |
|---|---|---|---|
| 매핑 CRUD | ✓ | ✓ | 조회만 |
| 자동 lock | ✓ | ✓ | — |
| 관리 lock (테이블/업무) | ✓ | × | × |
| 스냅샷 생성 | ✓ | ✓ | — |
| 스냅샷 rollback | ✓ | ✓ | — |
| 스냅샷 approve | ✓ | × | × |

### 6.2 Run 실행 관리

- 즉시 실행 (UI 버튼)
- 예약 실행 (스케줄러 — Quartz, cron 기반, 일회성·반복)
- 중단·재시작 (일시정지·재개·중단)
- 부분 재실행 (검증 실패 테이블만)

Run 모드:
- 전체 (모든 매핑된 테이블)
- 단일 테이블 (시범 이행·디버깅)
- 실패 테이블만 (격리 복구)

권한: master/admin (실행), viewer (조회)

### 6.3 진행 모니터링

- 실시간 진행 (WebSocket push)
- Worker 상태 (alive / busy / idle / down)
- 테이블별 진행 (대기 / 변환 / 적재 / 검증 / 완료 / 실패)
- 전체 통계 (총 row, 처리 row, 속도, ETA)

권한: 모든 role 조회 가능

### 6.4 격리 (Quarantine) 관리

- 격리 row 조회
- 격리 사유별 그룹화
- Sample 데이터 확인
- 매핑 점프 — 격리에서 해당 TO-BE 테이블 매핑 화면으로 이동
- 재시도 — 매핑 수정 후 해당 테이블만 재실행

권한: master/admin (처리), viewer (조회)

### 6.5 검증 리포트

- 테이블별 PASS/FAIL
- 검증 항목별 상세 (행수·합계·sample·체크섬)
- 불일치 row 목록
- 리포트 export (PDF / CSV)

권한: 모든 role 조회 가능

### 6.6 로그·산출물 출력

**Audit log:**
- 모든 작업 기록 (누가·언제·무엇·어디)
- 필터·검색 (사용자별 / 작업 종류별 / 시간 범위)
- Export (CSV)

**산출물 export (USB 운반용):**
- 검증 리포트 (PDF / CSV)
- 매핑 스냅샷 (YAML / JSON 백업)
- Audit log (CSV)
- Quarantine 데이터 (CSV)

권한: master (모든 로그), admin (매핑·실행 로그), viewer (조회만)

### 6.7 사용자·역할 관리

- 사용자 CRUD (ID·이름·비번·역할·만료일)
- 역할 부여 (master / admin / viewer)
- ID 만료일 설정·연장
- 비밀번호 초기화
- 강제 로그아웃

권한: master 만

### 6.8 워커 관리

- 워커 등록 (자동 또는 수동)
- 워커 상태 모니터링 (alive / busy / down)
- 워커 등록 해제
- 워커 토큰 폐기

권한: master

### 6.9 시스템 관리

- 라이선스 정보 표시 (사이트 ID · 발급일 · 만료일)
- 메타 DB 백업·복원
- 시스템 설정 (포트·로그 레벨·스케줄러 설정)
- 도구 버전 정보

권한: master

### 6.10 알림 (Notification)

**알림 종류:**

| 분류 | 항목 |
|---|---|
| 매핑 | Lock 발생/해제, 변경, Approve 요청·완료 |
| 실행 | Run 시작/완료, 예약 실행 트리거, 중단·실패 |
| 검증·격리 | 검증 실패, 격리 row 발생 |
| 시스템 | Worker 다운/복귀, 라이선스 만료 임박, 사용자 ID 만료 임박 |
| 사용자 | 새 사용자 생성, 비밀번호 변경, 강제 로그아웃 |

**메커니즘:**
- WebSocket 실시간 push
- 메타 DB 영속 (읽음/안 읽음 상태)
- 사용자 재로그인 시 미열람 알림 전달

**UI:**
- 헤더 bell icon + 읽지 않은 알림 수 badge
- 알림 클릭 시 관련 화면 deep link
- 알림 센터 (전체 조회·필터·읽음·삭제)

**필터·구독:**
- 사용자별 알림 종류 ON/OFF
- 권한 기반 자동 범위:
  - master: 모든 알림
  - admin: 본인 작업 + 격리·검증
  - viewer: 시스템 알림 (선택)

---

## 7. 첫 테스트 시나리오

### 7.1 목적

- ModernizeProData 의 end-to-end 동작 검증
- 5/31 마감 시점 합격 기준 확인

### 7.2 사전 준비

**환경:**
- Coordinator PC 1대
- Worker PC 4대 (총 5대)
- 모든 PC: Windows, 8 core / 16GB / SSD
- LAN 연결
- 모든 PC 에 `ModernizeProData.exe` 설치
- Worker config 에 Coordinator URL 입력

**데이터:**
- AS-IS: Oracle 형식의 더미 CSV 파일 직접 생성
  - 5~10 테이블
  - 인코딩 Shift JIS
  - 1:1 / 1:N / N:N 변환 케이스 포함
  - 수만~수십만 row 규모
  - Oracle DB 실제 띄울 필요 없음 (CSV 만)
- TO-BE: 로컬 PostgreSQL (Docker 또는 설치)
  - 빈 DB, 인코딩 UTF-8

**도구·계정:**
- Coordinator 에 `.lic` 적용
- master 1명
- master 가 admin 4명 계정 발급 (만료일 포함)
- viewer 는 이번 PoC 에서 미발급

### 7.3 시나리오 데이터 예시

| 테이블 | row 수 | 변환 유형 |
|---|---|---|
| customer | 50,000 | 1:1 |
| order | 200,000 | 1:1 |
| order_detail | 800,000 | 1:N |
| product | 5,000 | 1:1 |
| account_summary | 20,000 | N:N (JOIN 3개) |

총 약 100만 row. 인코딩 Shift JIS → UTF-8.

### 7.4 실행 순서

**Step 1 — 환경 준비:**
1. AS-IS Oracle 형식 더미 CSV 생성 (Shift JIS 인코딩)
2. CSV 를 Worker 디스크 또는 공유 폴더에 배치

**Step 2 — 로그인·등록:**
1. Coordinator PC 에서 `ModernizeProData.exe` 실행
2. master 로그인
3. Worker PC 4대 각자 실행 → Coordinator 자동 등록 확인
4. master 가 admin 4명 계정 발급 (만료일 지정)
5. 각 admin 이 Worker PC 에서 로그인

**Step 3 — 매핑 정의:**
1. master 가 AS-IS · TO-BE DDL 임포트
2. admin 4명이 병렬로 테이블별 매핑 작성 (자동 lock 동작 확인)
3. 인코딩 옵션 (source: shift_jis, target: utf-8) 지정
4. 1:N · N:N 매핑은 DuckDB SQL 로 작성
5. master 가 매핑 review · approve
6. 매핑 스냅샷 자동 생성

**Step 4 — 실행:**
1. master 가 즉시 실행 또는 예약 실행
2. Coordinator 가 작업을 Worker 4대에 분배
3. 각 Worker: CSV 읽기 → DuckDB 변환 → Parquet → Java COPY → PostgreSQL
4. 실시간 진행상황 모니터링 (WebSocket)
5. 알림 수신 확인

**Step 5 — 검증:**
1. DuckDB cross-source 검증 (행수·합계·sample)
2. 격리 row 발생 시 quarantine 화면 확인
3. 격리 → 매핑 화면 점프 → 매핑 수정 → 해당 테이블만 재실행

**Step 6 — 산출물 확인:**
1. 검증 리포트 export
2. 매핑 스냅샷 export
3. Audit log export
4. USB 운반 가능 확인

### 7.5 합격 기준

**기능:**
- 5명 (master 1 + admin 4) 동시 로그인 동작
- 매핑 자동 lock 동작 (충돌 없음)
- master 의 관리 lock (테이블·업무 단위) 동작
- 스냅샷 생성·rollback (admin 가능) / approve (master 만) 동작
- Worker 자동 등록·heartbeat 동작
- Worker 4대 병렬 처리 동작
- 인코딩 변환 (Shift JIS → UTF-8) 정상
- 1:1·1:N·N:N 매핑 모두 정상
- 검증 통과 (행수·합계·sample 일치)
- 격리 처리 + 매핑 점프 + 재실행 동작
- 알림 push·읽음 처리 동작
- 스케줄러 예약 실행 동작
- 산출물 export 정상

**비기능:**
- 100만 row 이행 30분 이내
- 5명 동시 사용 시 UI 응답 1초 이내
- Worker 다운 시 자동 재할당 동작
- 폐쇄망 환경 정상 동작
- jpackage 단일 인스톨러 설치·실행 가능

### 7.6 실패 시 처리

- 단위 테이블 실패 → quarantine 확인 → 매핑 수정 → 부분 재실행
- Worker 다운 → heartbeat 끊김 → 다른 Worker 재할당
- 전체 실패 → 매핑 스냅샷 rollback → 다시 시도

---

## 8. 고객 협의 사항

다음 항목은 ModernizeProData 도구 자체 결정이 아니라 **고객사(일본 금융권) 와 협의** 해서 정해야 한다.

### 8.1 시스템 환경

| 항목 | 협의 내용 |
|---|---|
| 사이트 PC 사양 | Coordinator · Worker PC 의 CPU / RAM / 디스크 사양 |
| OS | Windows Server 버전, 권한 |
| LAN 환경 | 대역폭, IP 할당, 방화벽 정책 (Coordinator port 개방) |
| USB 운반 절차 | 도구 · .lic · 업데이트 매체 운반 방법, 입회 절차 |
| 인터넷 차단 정도 | 완전 격리 vs 부분 망연계 |

### 8.2 데이터·이행 대상

| 항목 | 협의 내용 |
|---|---|
| AS-IS 시스템 | Oracle 버전 (11g / 12c / 19c / 21c), 인코딩, 데이터 양 |
| TO-BE 시스템 | PostgreSQL 버전, 인코딩 (UTF-8 / SJIS), 인프라 |
| 데이터 규모 | 테이블 수, 총 row 수, 총 디스크 크기 |
| 인덱스 정책 | 사전 생성 범위, 적재 중 drop 가능 여부 |
| 비표준 인코딩·필드 | EBCDIC variant, COMP/PACKED/ZONED 실제 존재 여부 |

### 8.3 추출·운영 일정

| 항목 | 협의 내용 |
|---|---|
| AS-IS 추출 방법 | 운영팀 추출 방식·시점·형식 (CSV/dump) |
| 데이터 전달 | CSV 전달 경로·빈도 |
| DDL freeze 기간 | 매핑 시작 ~ 이행 완료 동안 AS-IS DDL 변경 금지 합의 |
| 이행 일정 | 단일 실행 일자, 가용 윈도우, pre-load 가능 여부 |
| Go-live | 신 시스템 오픈 일자 |

### 8.4 매핑

| 항목 | 협의 내용 |
|---|---|
| 매핑 정의 작성자 | 매핑 정의를 작성할 담당 |

### 8.5 검증·승인

| 항목 | 협의 내용 |
|---|---|
| 검증 항목 | 행수·합계·sample·체크섬 중 필수 항목 |
| Pass/Fail 기준 | 허용 오차, 격리 row 허용 한계 |
| 격리 처리 방침 | 매핑 수정 / 데이터 보정 / 운영 영향 판단 |
| 최종 승인자 | 이행 완료 승인 권한자 |

### 8.6 장애·롤백

| 항목 | 협의 내용 |
|---|---|
| 장애 escalation | 도구 측 · 고객 측 담당자, 연락 절차 |
| 롤백 절차 | TO-BE truncate, AS-IS 복귀 시점 |
| 부분 실패 대응 | 일부 테이블 실패 시 진행 여부 |

### 8.7 운영·유지보수

| 항목 | 협의 내용 |
|---|---|
| Hypercare 기간 | 이행 후 모니터링 기간 (1~2주 등) |
| 도구 업데이트 | 패치 배포 절차 (USB 운반) |
| Audit log 보관 | 보관 기간·삭제 정책 |
| 인수인계 | 운영 매뉴얼·교육 일정 |

### 8.8 컴플라이언스

| 항목 | 협의 내용 |
|---|---|
| FISC 안전기준 | 적용 항목·증빙 자료 |
| 개인정보 | 데이터 분류·마스킹 필요성 |
| 감사 요구사항 | 별도 감사 흔적 요구 |

---

문서 끝.
