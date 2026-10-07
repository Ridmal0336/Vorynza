package com.vorynza.wedding.cateringmenu.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record MenuItemRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150)
        String name,

        @NotBlank(message = "Category is required")
        @Size(max = 80)
        String category,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", inclusive = true)
        BigDecimal price,

        String description,

        Boolean vegetarian,

        Long cateringPackageId,

        Boolean active
) {
}
