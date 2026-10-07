package com.vorynza.wedding.cateringmenu.repository;

import com.vorynza.wedding.cateringmenu.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    @Query("""
            SELECT m FROM MenuItem m
            WHERE (:category IS NULL OR LOWER(m.category) = LOWER(:category))
              AND (:activeOnly = false OR m.active = true)
            """)
    List<MenuItem> findByCategory(
            @Param("category") String category,
            @Param("activeOnly") boolean activeOnly
    );

    List<MenuItem> findByIdInAndActiveTrue(List<Long> ids);
}
