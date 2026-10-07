package com.vorynza.wedding.cateringmenu.repository;

import com.vorynza.wedding.cateringmenu.entity.CateringPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CateringPackageRepository extends JpaRepository<CateringPackage, Long> {

    @Query("""
            SELECT c FROM CateringPackage c
            WHERE (:category IS NULL OR LOWER(c.category) = LOWER(:category))
              AND (:activeOnly = false OR c.active = true)
            """)
    List<CateringPackage> findByCategory(
            @Param("category") String category,
            @Param("activeOnly") boolean activeOnly
    );
}
