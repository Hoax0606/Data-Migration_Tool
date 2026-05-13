package com.ksinfo.modernize_pro_data.coordinator.api;

import com.ksinfo.modernize_pro_data.common.dto.ApiResponse;
import com.ksinfo.modernize_pro_data.common.exception.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * 인증 컨트롤러 placeholder.
 *
 * POST /api/v1/auth/login   — JWT 발급 (TODO: 실제 사용자 인증·DB 조회)
 * POST /api/v1/auth/logout  — 토큰 무효화 (TODO)
 *
 * 현재는 master/admin 하드코딩으로 placeholder JWT 발급. 사용자·역할 관리 모듈
 * 구현 시 실제 인증·BCrypt 검증·DB 조회·역할 분기로 교체.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record LoginResponse(
            String token,
            String username,
            String role,
            OffsetDateTime expiresAt
    ) {}

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        // TODO: 실제 사용자 DB 조회 + BCrypt 검증 + JWT 발급
        // 현재는 placeholder: master / admin / viewer 만 하드코딩
        String role = switch (req.username()) {
            case "master" -> "master";
            case "admin"  -> "admin";
            case "viewer" -> "viewer";
            default -> throw new ApiException("AUTH_INVALID", "잘못된 계정", HttpStatus.UNAUTHORIZED);
        };

        if (!"password".equals(req.password())) {
            throw new ApiException("AUTH_INVALID", "잘못된 비밀번호", HttpStatus.UNAUTHORIZED);
        }

        log.info("Login: {} ({})", req.username(), role);

        return ApiResponse.ok(new LoginResponse(
                "placeholder-jwt-token-" + req.username(),
                req.username(),
                role,
                OffsetDateTime.now().plusHours(8)
        ));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout() {
        // TODO: 토큰 무효화 (현재는 stateless 라 클라이언트가 토큰 폐기만 하면 됨)
        return ApiResponse.ok(Map.of("message", "로그아웃 되었습니다"));
    }
}
