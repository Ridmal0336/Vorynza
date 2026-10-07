package com.vorynza.wedding.useraccount.dto;

import com.vorynza.wedding.useraccount.entity.User;
import com.vorynza.wedding.useraccount.entity.UserRole;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String address,
        UserRole role,
        boolean active,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
