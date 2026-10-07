package com.vorynza.wedding.cateringmenu.dto;

import com.vorynza.wedding.cateringmenu.entity.CateringPackage;

import java.math.BigDecimal;

public record CateringPackageResponse(
        Long id,
        String name,
        String category,
        BigDecimal price,
        String description,
        boolean vegetarian,
        boolean active
) {
    public static CateringPackageResponse from(CateringPackage entity) {
        return new CateringPackageResponse(
                entity.getId(),
                entity.getName(),
                entity.getCategory(),
                entity.getPrice(),
                entity.getDescription(),
                entity.isVegetarian(),
                entity.isActive()
        );
    }
}
