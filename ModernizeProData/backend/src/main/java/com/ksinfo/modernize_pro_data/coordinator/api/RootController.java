package com.ksinfo.modernize_pro_data.coordinator.api;

import com.ksinfo.modernize_pro_data.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 루트 (/) 안내.
 *
 * 이 백엔드는 API 서버다. UI 는 별도 (개발 시 Vite dev server, 운영 시
 * jpackage 네이티브 앱이 같은 프로세스에서 호스팅). 사용자가 브라우저로
 * 직접 8080 에 접속한 경우 친절한 안내 응답.
 */
@RestController
public class RootController {

    @Value("${spring.application.name}")
    private String appName;

    @Value("${modernize.mode}")
    private String mode;

    @GetMapping("/")
    public ApiResponse<Map<String, Object>> root() {
        return ApiResponse.ok(Map.of(
                "name", appName,
                "mode", mode,
                "type", "REST API server",
                "note", "이 endpoint 는 백엔드 API 서버입니다. UI 는 개발 시 http://localhost:5173 으로 접속.",
                "endpoints", List.of(
                        "GET  /api/v1/health",
                        "GET  /api/v1/health/info",
                        "POST /api/v1/auth/login"
                )
        ));
    }
}
