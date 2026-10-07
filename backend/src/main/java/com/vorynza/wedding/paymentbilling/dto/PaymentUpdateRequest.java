package com.vorynza.wedding.paymentbilling.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PaymentUpdateRequest(
        @NotNull(message = "Paid amount is required")
        @DecimalMin(value = "0.0", inclusive = true)
        BigDecimal paidAmount,

        @Size(max = 50)
        String paymentMethod
) {
}
