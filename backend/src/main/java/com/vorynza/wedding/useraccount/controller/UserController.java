package com.vorynza.wedding.useraccount.controller;

import com.vorynza.wedding.common.ApiResponse;
import com.vorynza.wedding.common.SecurityUtils;
import com.vorynza.wedding.useraccount.dto.ChangePasswordRequest;
import com.vorynza.wedding.useraccount.dto.UpdateUserRequest;
import com.vorynza.wedding.useraccount.dto.UserResponse;
import com.vorynza.wedding.useraccount.entity.User;
import com.vorynza.wedding.useraccount.entity.UserRole;
import com.vorynza.wedding.useraccount.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved", userService.findAll()));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Profile retrieved",
                userService.findByEmail(SecurityUtils.requireEmail(authentication))
        ));
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(SecurityUtils.requireEmail(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok("Password updated", null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        assertSelfOrAdmin(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok("User retrieved", userService.findById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        User current = userService.getByEmail(SecurityUtils.requireEmail(authentication));
        assertSelfOrAdmin(id, authentication);
        if (current.getRole() != UserRole.ADMIN) {
            request = new UpdateUserRequest(
                    request.fullName(),
                    request.email(),
                    request.phone(),
                    request.address(),
                    null,
                    null
            );
        }
        return ResponseEntity.ok(ApiResponse.ok("User updated", userService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        userService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.ok("User deactivated", null));
    }

    private void assertSelfOrAdmin(Long id, Authentication authentication) {
        User current = userService.getByEmail(SecurityUtils.requireEmail(authentication));
        if (current.getRole() != UserRole.ADMIN && !current.getId().equals(id)) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
