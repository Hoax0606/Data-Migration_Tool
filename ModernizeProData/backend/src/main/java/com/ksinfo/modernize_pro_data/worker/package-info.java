/**
 * Worker 기능 패키지.
 *
 * Coordinator 에서 작업을 받아 AS-IS CSV 추출·DuckDB 변환·TO-BE 적재·
 * 검증을 수행하는 worker 역할의 구성요소를 포함한다.
 *
 * 하위 패키지 예정:
 *  - register   Coordinator 등록·heartbeat
 *  - extract    AS-IS 파일 read + 인코딩 전처리
 *  - transform  DuckDB SQL 변환 → Parquet
 *  - load       Parquet → TO-BE JDBC COPY
 *  - verify     DuckDB cross-source 검증
 *  - quarantine 격리 row 처리
 */
package com.ksinfo.modernize_pro_data.worker;
