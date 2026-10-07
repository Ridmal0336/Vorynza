package com.vorynza.wedding.hallvenue.repository;

import com.vorynza.wedding.hallvenue.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HallRepository extends JpaRepository<Hall, Long> {

    long countByHotelId(Long hotelId);

    @Query("""
            SELECT h FROM Hall h
            WHERE (:minCapacity IS NULL OR h.capacity >= :minCapacity)
              AND (:activeOnly = false OR h.active = true)
            """)
    List<Hall> findByMinCapacity(
            @Param("minCapacity") Integer minCapacity,
            @Param("activeOnly") boolean activeOnly
    );
}
