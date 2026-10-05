package com.vorynza.wedding.reservation.repository;

import com.vorynza.wedding.reservation.entity.Reservation;
import com.vorynza.wedding.reservation.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("""
            SELECT DISTINCT r FROM Reservation r
            JOIN FETCH r.user
            JOIN FETCH r.hall
            JOIN FETCH r.weddingPackage
            """)
    List<Reservation> findAllWithDetails();

    @Query("""
            SELECT DISTINCT r FROM Reservation r
            JOIN FETCH r.user
            JOIN FETCH r.hall
            JOIN FETCH r.weddingPackage
            WHERE r.user.id = :userId
            """)
    List<Reservation> findByUserIdWithDetails(@Param("userId") Long userId);

    List<Reservation> findByUserId(Long userId);

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
            FROM Reservation r
            WHERE r.hall.id = :hallId
              AND r.eventDate = :eventDate
              AND r.status <> com.vorynza.wedding.reservation.entity.ReservationStatus.CANCELLED
              AND (:excludeId IS NULL OR r.id <> :excludeId)
            """)
    boolean existsActiveBookingExcluding(
            @Param("hallId") Long hallId,
            @Param("eventDate") LocalDate eventDate,
            @Param("excludeId") Long excludeId
    );

    default boolean existsActiveBooking(Long hallId, LocalDate eventDate) {
        return existsActiveBookingExcluding(hallId, eventDate, null);
    }

    long countByStatus(ReservationStatus status);
}
