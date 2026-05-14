import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProjectPhase =
  | 'planning'
  | 'analysis'
  | 'sign-off'
  | 'rehearsal'
  | 'cutover'
  | 'hypercare'
  | 'done';

export type SiteEnv = 'mainframe' | 'midrange' | 'cloud' | 'on-prem' | 'other';
export type SourceEncoding = 'shift_jis' | 'euc-jp' | 'utf-8' | 'ebcdic';
export type ProjectEnvironment = 'test' | 'dev' | 'staging' | 'production';

export const PROJECT_ENVIRONMENTS: ProjectEnvironment[] = ['test', 'dev', 'staging', 'production'];

export interface SiteDbConnection {
  type: string;     // 'PostgreSQL' | 'Oracle' | ...
  version: string;
  host: string;
  port: string;
  username: string;
  password: string; // prototype 한정. 실제는 vault 로 교체.
}

export type TobeDbByEnv = Partial<Record<ProjectEnvironment, SiteDbConnection>>;
export type TobeDbLocks = Partial<Record<ProjectEnvironment, boolean>>;

export interface Site {
  id: string;
  name: string;
  asisEnv: SiteEnv;
  tobeEnv: SiteEnv;
  asisEncoding: SourceEncoding;
  tobeEncoding: SourceEncoding;
  /** AS-IS CSV 디렉터리 경로. 도구가 이 경로에서 직접 CSV를 읽어 Parquet 변환. */
  csvPath: string;
  notes?: string;
  /** 현재 활성 운영 단계 (test/dev/staging/production). TO-BE DB 는 이 단계의 것을 사용. */
  environment: ProjectEnvironment;
  /** 운영 단계별로 따로 저장하는 TO-BE DB 접속 정보. */
  tobeDbByEnv: TobeDbByEnv;
  /**
   * 단계별 lock 상태.
   * - 저장 시 자동 lock.
   * - Worker 는 read-only, Coordinator(master) 만 해제 가능.
   */
  tobeDbLocks: TobeDbLocks;
  createdAt: string;
}

export interface DdlFile {
  name: string;
  size: number;
  uploadedAt: string;
}

export interface CutoverMeta {
  snapshotId?: string;
  /** Coordinator 가 지정한 담당자 (username). cutover 책임자 라벨. */
  assignee?: string;
  startedAt?: string;
  startedBy?: string;
  abortedAt?: string;
  abortedBy?: string;
  abortReason?: string;
  finishedAt?: string;
  finishedBy?: string;
}

export interface Project {
  id: string;
  siteId: string;
  name: string;
  phase: ProjectPhase;
  tableCount: number;
  ddlFiles: DdlFile[];
  /** 담당자 username — 작성 시 현재 로그인 사용자로 자동 설정. */
  owner: string;
  /** 프로젝트를 배정받은 사용자 username. Site Overview / Execution Overview 의 dropdown 으로 변경. */
  assignee?: string;
  /** cutover 실행 메타 (시작·중단·완료 누가 언제). Coordinator 만 수정. */
  cutover?: CutoverMeta;
  createdAt: string;
}

interface WorkspaceState {
  sites: Site[];
  projects: Project[];
  activeSiteId: string | null;
  activeProjectId: string | null;

  /* getters */
  getActiveSite: () => Site | null;
  getActiveProject: () => Project | null;
  getProjectsForActiveSite: () => Project[];

  /* mutations */
  createSite: (data: Omit<Site, 'id' | 'createdAt'>) => Site;
  updateSite: (id: string, patch: Partial<Omit<Site, 'id' | 'createdAt'>>) => void;
  createProject: (data: Omit<Project, 'id' | 'siteId' | 'createdAt'>) => Project;
  setActiveSite: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  deleteProject: (id: string) => void;
  deleteSite: (id: string) => void;
  addDdlFiles: (projectId: string, files: DdlFile[]) => void;
  removeDdlFile: (projectId: string, fileName: string) => void;

  /** cutover 상태 전환 (Coordinator 전용 — UI 측에서 게이트) */
  startCutover: (projectId: string, snapshotId: string, by: string) => void;
  abortCutover: (projectId: string, reason: string, by: string) => void;
  finishCutover: (projectId: string, by: string) => void;
  /** cutover 담당자 지정 (Coordinator 전용). undefined = 미배정 */
  assignCutover: (projectId: string, assignee: string | undefined) => void;
  /** Project 단위 담당자 지정. undefined = 미배정. */
  setProjectAssignee: (projectId: string, assignee: string | undefined) => void;
}

const newId = () => 's' + Math.random().toString(36).slice(2, 9);

export const emptyDbConnection = (): SiteDbConnection => ({
  type: '',
  version: '',
  host: '',
  port: '',
  username: '',
  password: '',
});

/**
 * 사이트·프로젝트 관리 store.
 * 현재는 frontend localStorage 만 사용 — 추후 백엔드 API 로 교체.
 *
 * v7 (2026-05): Site 에 environment + tobeDbByEnv 도입. Project 에서 environment 제거.
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      sites: [],
      projects: [],
      activeSiteId: null,
      activeProjectId: null,

      getActiveSite: () => {
        const { sites, activeSiteId } = get();
        return sites.find((s) => s.id === activeSiteId) ?? null;
      },
      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find((p) => p.id === activeProjectId) ?? null;
      },
      getProjectsForActiveSite: () => {
        const { projects, activeSiteId } = get();
        return projects.filter((p) => p.siteId === activeSiteId);
      },

      createSite: (data) => {
        const site: Site = {
          id: newId(),
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ sites: [...s.sites, site], activeSiteId: site.id }));
        return site;
      },

      updateSite: (id, patch) =>
        set((s) => ({
          sites: s.sites.map((site) => (site.id === id ? { ...site, ...patch } : site)),
        })),

      createProject: (data) => {
        const { activeSiteId } = get();
        if (!activeSiteId) throw new Error('No active site');
        const project: Project = {
          id: newId(),
          siteId: activeSiteId,
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({
          projects: [...s.projects, project],
          activeProjectId: project.id,
        }));
        return project;
      },

      setActiveSite: (id) => set({ activeSiteId: id, activeProjectId: null }),
      setActiveProject: (id) => set({ activeProjectId: id }),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),

      deleteSite: (id) =>
        set((s) => ({
          sites: s.sites.filter((x) => x.id !== id),
          projects: s.projects.filter((p) => p.siteId !== id),
          activeSiteId: s.activeSiteId === id ? null : s.activeSiteId,
          activeProjectId: null,
        })),

      addDdlFiles: (projectId, files) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            // 같은 이름은 새 항목으로 덮어쓰기 (재업로드)
            const existing = p.ddlFiles.filter((f) => !files.some((nf) => nf.name === f.name));
            return { ...p, ddlFiles: [...existing, ...files] };
          }),
        })),

      removeDdlFile: (projectId, fileName) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, ddlFiles: p.ddlFiles.filter((f) => f.name !== fileName) } : p,
          ),
        })),

      startCutover: (projectId, snapshotId, by) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  phase: 'cutover',
                  cutover: {
                    snapshotId,
                    startedAt: new Date().toISOString(),
                    startedBy: by,
                  },
                }
              : p,
          ),
        })),

      abortCutover: (projectId, reason, by) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  phase: 'rehearsal',
                  cutover: {
                    ...(p.cutover ?? {}),
                    abortedAt: new Date().toISOString(),
                    abortedBy: by,
                    abortReason: reason,
                  },
                }
              : p,
          ),
        })),

      finishCutover: (projectId, by) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  phase: 'hypercare',
                  cutover: {
                    ...(p.cutover ?? {}),
                    finishedAt: new Date().toISOString(),
                    finishedBy: by,
                  },
                }
              : p,
          ),
        })),

      assignCutover: (projectId, assignee) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, cutover: { ...(p.cutover ?? {}), assignee: assignee || undefined } }
              : p,
          ),
        })),

      setProjectAssignee: (projectId, assignee) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, assignee: assignee || undefined } : p,
          ),
        })),
    }),
    {
      name: 'modernize-workspace',
      version: 8,
      migrate: (persisted, version) => {
        const state = persisted as { sites?: unknown[]; projects?: unknown[] } & Record<string, unknown>;

        if (version < 8 && Array.isArray(state.sites)) {
          state.sites = state.sites.map((raw) => {
            const s = raw as Omit<Partial<Site>, 'environment' | 'tobeDbByEnv'> & {
              environment?: string;
              encoding?: SourceEncoding;
              tobeDb?: SiteDbConnection;
              tobeDbByEnv?: TobeDbByEnv;
              tobeDbLocks?: TobeDbLocks;
            };
            const tobeFallback: SiteEnv = (s.environment === 'cloud' || s.environment === 'on-prem')
              ? (s.environment as SiteEnv)
              : 'on-prem';
            const legacyEnc: SourceEncoding = s.encoding ?? 'shift_jis';

            const isProjEnv = (e: unknown): e is ProjectEnvironment =>
              e === 'test' || e === 'dev' || e === 'staging' || e === 'production';
            const projectEnv: ProjectEnvironment = isProjEnv(s.environment) ? s.environment : 'dev';

            // v6 → v7: single tobeDb 를 tobeDbByEnv[projectEnv] 로 이전.
            const byEnv: TobeDbByEnv = s.tobeDbByEnv ?? {};
            if (s.tobeDb && !byEnv[projectEnv]) byEnv[projectEnv] = s.tobeDb;

            // v8: 기존에 저장된 단계는 잠금 처리.
            const locks: TobeDbLocks = s.tobeDbLocks ?? {};
            for (const env of ['test', 'dev', 'staging', 'production'] as ProjectEnvironment[]) {
              if (byEnv[env] && locks[env] === undefined) locks[env] = true;
            }

            return {
              id: s.id ?? newId(),
              name: s.name ?? 'Untitled',
              asisEnv: s.asisEnv ?? 'mainframe',
              tobeEnv: s.tobeEnv ?? tobeFallback,
              asisEncoding: s.asisEncoding ?? legacyEnc,
              tobeEncoding: s.tobeEncoding ?? 'utf-8',
              csvPath: s.csvPath ?? '',
              notes: s.notes,
              environment: projectEnv,
              tobeDbByEnv: byEnv,
              tobeDbLocks: locks,
              createdAt: s.createdAt ?? new Date().toISOString(),
            } satisfies Site;
          });
        }

        if (version < 8 && Array.isArray(state.projects)) {
          state.projects = state.projects.map((raw) => {
            const p = raw as Partial<Project> & { src?: string; tgt?: string; environment?: string };
            return {
              id: p.id ?? newId(),
              siteId: p.siteId ?? '',
              name: p.name ?? 'Untitled',
              phase: p.phase ?? 'planning',
              // environment 제거 — 이제 site 레벨
              tableCount: p.tableCount ?? 0,
              ddlFiles: p.ddlFiles ?? [],
              owner: p.owner ?? '—',
              createdAt: p.createdAt ?? new Date().toISOString(),
            } satisfies Project;
          });
        }

        return state as unknown as WorkspaceState;
      },
    },
  ),
);
