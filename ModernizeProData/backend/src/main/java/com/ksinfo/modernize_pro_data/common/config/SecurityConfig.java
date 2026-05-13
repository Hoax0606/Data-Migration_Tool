package com.ksinfo.modernize_pro_data.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security 기본 설정.
 *
 * - Stateless (JWT 토큰 기반, 세션 없음)
 * - 인증 없이 허용: /api/v1/health, /api/v1/auth/**, H2 console, WebSocket handshake
 * - 그 외 모든 경로는 인증 필요 (JWT 필터는 추후 추가)
 *
 * JWT 토큰 검증 필터는 TODO — 인증 모듈 구현 시 추가.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {}) // CorsFilter 가 처리
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(h -> h.frameOptions(f -> f.disable())) // H2 console iframe 허용
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/health/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/ws/**").permitAll() // WebSocket handshake
                        .anyRequest().permitAll() // TODO: JWT 필터 후 authenticated() 로 변경
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
