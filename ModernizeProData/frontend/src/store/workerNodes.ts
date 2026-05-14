import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NodeStatus = 'online' | 'offline' | 'registering' | 'revoked';

export interface WorkerNode {
  id: string;
  /** OS hostname — 이 PC 의 컴퓨터 이름 (= 노드의 canonical 식별자). */
  name: string;
  ipAddress: string;
  /** Coordinator 발급 노드 토큰. 실제 운영에선 hash 저장. */
  token: string;
  status: NodeStatus;
  cpuCores?: number;
  ramGb?: number;
  /** 현재 이 PC 에 로그인한 사용자의 username. 로그인 시 자동 부여. */
  assignedTo?: string;
  registeredAt: string;
  lastHeartbeatAt?: string;
}

interface WorkerNodesState {
  nodes: WorkerNode[];

  registerNode: (data: Pick<WorkerNode, 'name' | 'ipAddress'> & Partial<Pick<WorkerNode, 'cpuCores' | 'ramGb'>>) => WorkerNode;
  revokeNode: (id: string) => void;
  updateNodeStatus: (id: string, status: NodeStatus) => void;
  assignNode: (id: string, username: string | undefined) => void;
}

const newId = () => 'n' + Math.random().toString(36).slice(2, 9);

/** 32자 hex 토큰 (prototype). 실제 운영에선 서버에서 발급. */
const newToken = () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const seedToken = (suffix: string) => 'aabbcc11ddee22ff33gg44hh55ii66' + suffix;

/**
 * Worker Node 관리 store — Coordinator 가 노드를 클러스터에 등록·해지.
 * 현재는 frontend localStorage placeholder — 실제 발급·하트비트는 백엔드와 LAN REST/WebSocket.
 */
export const useWorkerNodesStore = create<WorkerNodesState>()(
  persist(
    (set) => ({
      nodes: [
        {
          id: 'n-coord',
          name: 'COORD-01',
          ipAddress: '10.20.30.40',
          token: seedToken('00'),
          status: 'online',
          cpuCores: 16,
          ramGb: 64,
          assignedTo: 'master',
          registeredAt: '2026-01-01T00:00:00Z',
          lastHeartbeatAt: new Date().toISOString(),
        },
        {
          id: 'n-w1',
          name: 'WORK-01',
          ipAddress: '10.20.30.41',
          token: seedToken('01'),
          status: 'online',
          cpuCores: 8,
          ramGb: 32,
          assignedTo: 'admin1',
          registeredAt: '2026-01-10T00:00:00Z',
          lastHeartbeatAt: new Date(Date.now() - 60_000).toISOString(),
        },
        {
          id: 'n-w2',
          name: 'WORK-02',
          ipAddress: '10.20.30.42',
          token: seedToken('02'),
          status: 'online',
          cpuCores: 8,
          ramGb: 32,
          assignedTo: 'admin2',
          registeredAt: '2026-01-10T00:00:00Z',
          lastHeartbeatAt: new Date(Date.now() - 90_000).toISOString(),
        },
        {
          id: 'n-w3',
          name: 'WORK-03',
          ipAddress: '10.20.30.43',
          token: seedToken('03'),
          status: 'offline',
          cpuCores: 8,
          ramGb: 32,
          assignedTo: 'admin3',
          registeredAt: '2026-02-15T00:00:00Z',
          lastHeartbeatAt: '2026-04-30T14:22:00Z',
        },
      ],

      registerNode: (data) => {
        const node: WorkerNode = {
          id: newId(),
          token: newToken(),
          status: 'registering',
          registeredAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ nodes: [...s.nodes, node] }));
        return node;
      },

      revokeNode: (id) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
        })),

      updateNodeStatus: (id, status) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, status } : n)),
        })),

      assignNode: (id, username) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, assignedTo: username || undefined } : n)),
        })),
    }),
    {
      name: 'modernize-worker-nodes',
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as { nodes?: Array<WorkerNode & { hostname?: string }> } & Record<string, unknown>;
        if (version < 3 && Array.isArray(state.nodes)) {
          // v3: hostname 컬럼 제거 — name 이 곧 hostname.
          // 기존 데이터에 hostname 이 있고 name 이 더 친화적 라벨이면 hostname 으로 통합.
          state.nodes = state.nodes.map((raw) => {
            const { hostname, ...rest } = raw;
            return {
              ...rest,
              name: hostname || rest.name, // hostname 있으면 그쪽이 canonical
            };
          });
        }
        return state as unknown as WorkerNodesState;
      },
    },
  ),
);
