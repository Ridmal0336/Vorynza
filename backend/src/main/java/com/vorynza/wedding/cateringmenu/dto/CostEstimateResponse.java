package com.vorynza.wedding.cateringmenu.dto;

import java.math.BigDecimal;
import java.util.List;

public record CostEstimateResponse(
        Integer guestCount,
        BigDecimal packageCost,
        BigDecimal menuItemsCost,
        BigDecimal totalCost,
        List<String> lineItems
) {
}
