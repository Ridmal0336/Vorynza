package com.vorynza.wedding.useraccount.dto;

import com.vorynza.wedding.useraccount.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(max = 120)
        String fullName,

        @Email(message = "Email must be valid")
        @Size(max = 180)
        String email,

        @Size(max = 30)
        String phone,

        @Size(max = 255)
        String address,

        UserRole role,

        Boolean active
) {
}
