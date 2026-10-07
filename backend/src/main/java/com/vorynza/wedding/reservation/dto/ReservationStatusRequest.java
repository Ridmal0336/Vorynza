package com.vorynza.wedding.reservation.dto;

import com.vorynza.wedding.reservation.entity.ReservationStatus;
import jakarta.validation.constraints.NotNull;

public record ReservationStatusRequest(
        @NotNull(message = "Status is required")
        ReservationStatus status
) {
}
