package com.vorynza.wedding.hallvenue.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record HallRequest(
        @NotNull(message = "Hotel id is required")
        Long hotelId,

        @NotBlank(message = "Name is required")
        @Size(max = 150)
        String name,

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        Integer capacity,

        @Size(max = 120)
        String decorationTheme,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = true)
        BigDecimal price,

        String imageUrls,

        BigDecimal averageRating,

        Boolean active
) {
}
