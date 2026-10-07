package com.vorynza.wedding.cateringmenu.dto;

import com.vorynza.wedding.cateringmenu.entity.MenuItem;

import java.math.BigDecimal;

public record MenuItemResponse(
        Long id,
        String name,
        String category,
        BigDecimal price,
        String description,
        boolean vegetarian,
        Long cateringPackageId,
        boolean active
) {
    public static MenuItemResponse from(MenuItem item) {
        return new MenuItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getPrice(),
                item.getDescription(),
                item.isVegetarian(),
                item.getCateringPackage() != null ? item.getCateringPackage().getId() : null,
                item.isActive()
        );
    }
}
