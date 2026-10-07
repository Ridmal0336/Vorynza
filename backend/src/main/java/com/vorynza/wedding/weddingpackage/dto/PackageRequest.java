package com.vorynza.wedding.weddingpackage.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PackageRequest(
        @NotNull(message = "Hotel id is required")
        Long hotelId,

        @NotBlank(message = "Name is required")
        @Size(max = 150)
        String name,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = true)
        BigDecimal price,

        @NotBlank(message = "Inclusions are required")
        String inclusions,

        String description,

        @Size(max = 80)
        String packageType,

        @Size(max = 500)
        String imageUrl,

        BigDecimal discountPercent,

        Boolean featured,

        Boolean active
) {
}
