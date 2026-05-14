package com.ksinfo.modernize_pro_data.coordinator.auth;

import com.ksinfo.modernize_pro_data.common.exception.ApiException;
import com.ksinfo.modernize_pro_data.coordinator.user.User;
import com.ksinfo.modernize_pro_data.coordinator.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * 로그인 처리 — DB 조회 + BCrypt 검증 + JWT 발급 + lastSignInAt 갱신.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public record LoginResult(String token, String username, String role, OffsetDateTime expiresAt) {}

    @Transactional
    public LoginResult login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(
                        "AUTH_USER_NOT_FOUND",
                        "존재하지 않는 사용자",
                        HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(
                    "AUTH_PASSWORD_INVALID",
                    "비밀번호가 일치하지 않습니다",
                    HttpStatus.UNAUTHORIZED);
        }

        user.setLastSignInAt(OffsetDateTime.now());
        userRepository.save(user);

        String role = user.getRole().name();
        String token = jwtService.issue(user.getUsername(), role);
        OffsetDateTime expiresAt = jwtService.expirationOf(token);

        log.info("Login OK: {} ({})", user.getUsername(), role);
        return new LoginResult(token, user.getUsername(), role, expiresAt);
    }
}
