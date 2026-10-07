package com.vorynza.wedding.hallvenue.dto;

import com.vorynza.wedding.hallvenue.entity.Hall;

import java.math.BigDecimal;

public record HallResponse(
        Long id,
        Long hotelId,
        String hotelName,
        String name,
        Integer capacity,
        String decorationTheme,
        BigDecimal price,
        String imageUrls,
        BigDecimal averageRating,
        boolean active
) {
    public static HallResponse from(Hall hall) {
        return new HallResponse(
                hall.getId(),
                hall.getHotel().getId(),
                hall.getHotel().getName(),
                hall.getName(),
                hall.getCapacity(),
                hall.getDecorationTheme(),
                hall.getPrice(),
                hall.getImageUrls(),
                hall.getAverageRating(),
                hall.isActive()
        );
    }
}
