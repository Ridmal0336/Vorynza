package com.vorynza.wedding.reservation.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ReservationRequest(
        Long userId,

        @NotNull(message = "Hall id is required")
        Long hallId,

        @NotNull(message = "Package id is required")
        Long packageId,

        @NotNull(message = "Event date is required")
        @FutureOrPresent(message = "Event date cannot be in the past")
        LocalDate eventDate,

        @NotNull(message = "Guest count is required")
        @Min(value = 1, message = "Guest count must be at least 1")
        Integer guestCount,

        @Size(max = 500)
        String notes
) {
}
