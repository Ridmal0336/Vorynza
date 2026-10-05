package com.vorynza.wedding.reservation.dto;

import com.vorynza.wedding.reservation.entity.ReservationStatus;

import java.time.LocalDate;

public record ReservationConfirmationResponse(
        Long reservationId,
        String confirmationCode,
        String customerName,
        String hallName,
        String packageName,
        LocalDate eventDate,
        Integer guestCount,
        ReservationStatus status,
        String message
) {
}
