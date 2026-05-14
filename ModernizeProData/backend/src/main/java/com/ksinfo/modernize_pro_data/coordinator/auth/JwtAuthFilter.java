package com.ksinfo.modernize_pro_data.coordinator.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Authorization: Bearer xxx 헤더의 JWT 를 검증하고 SecurityContext 에 사용자/권한 주입.
 * 토큰 없거나 잘못된 경우 그냥 통과 (SecurityConfig 의 authorizeHttpRequests 가 거부).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            jwtService.parse(token).ifPresent(claims -> {
                String username = claims.getSubject();
                String role = claims.get("role", String.class);
                if (username != null && role != null) {
                    var authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());
                    var auth = new UsernamePasswordAuthenticationToken(username, null, List.of(authority));
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            });
        }
        chain.doFilter(request, response);
    }
}
