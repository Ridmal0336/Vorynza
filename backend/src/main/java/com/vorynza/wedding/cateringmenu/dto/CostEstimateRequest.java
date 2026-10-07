package com.vorynza.wedding.cateringmenu.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CostEstimateRequest(
        Long cateringPackageId,

        List<Long> menuItemIds,

        @NotNull(message = "Guest count is required")
        @Min(value = 1, message = "Guest count must be at least 1")
        Integer guestCount
) {
}
