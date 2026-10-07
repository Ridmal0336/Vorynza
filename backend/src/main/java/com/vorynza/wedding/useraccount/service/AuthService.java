package com.vorynza.wedding.useraccount.service;

import com.vorynza.wedding.common.BusinessException;
import com.vorynza.wedding.config.JwtService;
import com.vorynza.wedding.useraccount.dto.AuthResponse;
import com.vorynza.wedding.useraccount.dto.LoginRequest;
import com.vorynza.wedding.useraccount.dto.RegisterRequest;
import com.vorynza.wedding.useraccount.dto.UserResponse;
import com.vorynza.wedding.useraccount.entity.User;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserService userService;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserService userService,
            CustomUserDetailsService userDetailsService,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userService = userService;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        UserResponse user = userService.register(request);
        UserDetails details = userDetailsService.loadUserByUsername(user.email());
        String token = jwtService.generateToken(details);
        return AuthResponse.of(token, user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
        );
        User user = userService.getByEmail(request.email());
        if (!user.isActive()) {
            throw new BusinessException("Account is deactivated");
        }
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(details);
        return AuthResponse.of(token, UserResponse.from(user));
    }
}
