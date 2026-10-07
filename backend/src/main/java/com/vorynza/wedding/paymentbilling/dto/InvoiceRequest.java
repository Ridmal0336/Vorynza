package com.vorynza.wedding.paymentbilling.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record InvoiceRequest(
        @NotNull(message = "Reservation id is required")
        Long reservationId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", inclusive = true)
        BigDecimal amount
) {
}
