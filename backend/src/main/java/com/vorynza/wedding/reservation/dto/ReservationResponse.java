package com.vorynza.wedding.reservation.dto;

import com.vorynza.wedding.reservation.entity.Reservation;
import com.vorynza.wedding.reservation.entity.ReservationStatus;

import java.time.Instant;
import java.time.LocalDate;

public record ReservationResponse(
        Long id,
        Long userId,
        String customerName,
        String customerEmail,
        Long hallId,
        String hallName,
        Long packageId,
        String packageName,
        LocalDate eventDate,
        Integer guestCount,
        ReservationStatus status,
        String notes,
        Instant createdAt
) {
    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getUser().getId(),
                reservation.getUser().getFullName(),
                reservation.getUser().getEmail(),
                reservation.getHall().getId(),
                reservation.getHall().getName(),
                reservation.getWeddingPackage().getId(),
                reservation.getWeddingPackage().getName(),
                reservation.getEventDate(),
                reservation.getGuestCount(),
                reservation.getStatus(),
                reservation.getNotes(),
                reservation.getCreatedAt()
        );
    }
}
