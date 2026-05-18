package com.ksinfo.modernize_pro_data.coordinator.site;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SnapshotRepository extends JpaRepository<Snapshot, String> {
    List<Snapshot> findByProjectId(String projectId);
    List<Snapshot> findByProjectIdIn(List<String> projectIds);
}
