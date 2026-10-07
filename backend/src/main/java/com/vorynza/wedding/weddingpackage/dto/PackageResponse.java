package com.vorynza.wedding.weddingpackage.dto;

import com.vorynza.wedding.weddingpackage.entity.WeddingPackage;

import java.math.BigDecimal;

public record PackageResponse(
        Long id,
        Long hotelId,
        String hotelName,
        String name,
        BigDecimal price,
        String inclusions,
        String description,
        String packageType,
        String imageUrl,
        BigDecimal discountPercent,
        boolean featured,
        boolean active
) {
    public static PackageResponse from(WeddingPackage entity) {
        return new PackageResponse(
                entity.getId(),
                entity.getHotel().getId(),
                entity.getHotel().getName(),
                entity.getName(),
                entity.getPrice(),
                entity.getInclusions(),
                entity.getDescription(),
                entity.getPackageType(),
                entity.getImageUrl(),
                entity.getDiscountPercent(),
                entity.isFeatured(),
                entity.isActive()
        );
    }
}
