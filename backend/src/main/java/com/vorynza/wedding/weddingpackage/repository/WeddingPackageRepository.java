package com.vorynza.wedding.weddingpackage.repository;

import com.vorynza.wedding.weddingpackage.entity.WeddingPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface WeddingPackageRepository extends JpaRepository<WeddingPackage, Long> {

    long countByHotelId(Long hotelId);

    @Query("""
            SELECT p FROM WeddingPackage p
            WHERE (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:type IS NULL OR LOWER(p.packageType) = LOWER(:type))
              AND (:featured IS NULL OR p.featured = :featured)
              AND (:activeOnly = false OR p.active = true)
            """)
    List<WeddingPackage> search(
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("type") String type,
            @Param("featured") Boolean featured,
            @Param("activeOnly") boolean activeOnly
    );
}
