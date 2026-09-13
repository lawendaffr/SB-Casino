package me.polonium.kasynobackend.auth;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import me.polonium.kasynobackend.entity.User;
import me.polonium.kasynobackend.repository.UserRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenthicationFilter extends OncePerRequestFilter   {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenthicationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");

        if(authorization == null ||
        !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request,response);
            return;
        }

        String token = authorization.substring(7);
        if(!jwtService.isValid(token)) {
            filterChain.doFilter(request,response);
            return;
        }

        Long userId = jwtService.extractUserId(token);

        User user = userRepository.findById(userId).orElse(null);
        if(user == null) {
            filterChain.doFilter(request,response);
            return;
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        user.getId(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                );


        SecurityContextHolder
                .getContext()
                .setAuthentication(authentication);
        filterChain.doFilter(request,response);
    }
}
