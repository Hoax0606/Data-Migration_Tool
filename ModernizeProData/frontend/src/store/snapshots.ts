import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SnapshotStatus = 'pending' | 'approved' | 'rejected';

export interface MappingSnapshot {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: SnapshotStatus;
  /** 작성자 username (Worker 또는 Coordinator) */
  createdBy: string;
  createdAt: string;
  /** Coordinator 승인 정보 (status === 'approved') */
  approvedBy?: string;
  approvedAt?: string;
  /** Coordinator 거부 정보 (status === 'rejected') */
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  tableCount: number;
  ruleCount: number;
}

interface SnapshotsState {
  snapshots: MappingSnapshot[];

  createSnapshot: (data: Pick<MappingSnapshot, 'projectId' | 'name' | 'createdBy'> & Partial<Pick<MappingSnapshot, 'description' | 'tableCount' | 'ruleCount'>>) => MappingSnapshot;
  approveSnapshot: (id: string, approver: string) => void;
  rejectSnapshot: (id: string, approver: string, reason: string) => void;
  deleteSnapshot: (id: string) => void;
}

const newId = () => 'ss' + Math.random().toString(36).slice(2, 9);

/**
 * 매핑 스냅샷 store.
 * 신규 스냅샷은 pending 상태로 생성 → Coordinator 가 approve / reject.
 */
export const useSnapshotsStore = create<SnapshotsState>()(
  persist(
    (set) => ({
      snapshots: [],

      createSnapshot: (data) => {
        const s: MappingSnapshot = {
          id: newId(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          tableCount: data.tableCount ?? 0,
          ruleCount: data.ruleCount ?? 0,
          ...data,
        };
        set((st) => ({ snapshots: [...st.snapshots, s] }));
        return s;
      },

      approveSnapshot: (id, approver) =>
        set((st) => ({
          snapshots: st.snapshots.map((s) =>
            s.id === id
              ? { ...s, status: 'approved' as const, approvedBy: approver, approvedAt: new Date().toISOString() }
              : s,
          ),
        })),

      rejectSnapshot: (id, approver, reason) =>
        set((st) => ({
          snapshots: st.snapshots.map((s) =>
            s.id === id
              ? { ...s, status: 'rejected' as const, rejectedBy: approver, rejectedAt: new Date().toISOString(), rejectionReason: reason }
              : s,
          ),
        })),

      deleteSnapshot: (id) =>
        set((st) => ({
          snapshots: st.snapshots.filter((s) => s.id !== id),
        })),
    }),
    { name: 'modernize-snapshots', version: 1 },
  ),
);
