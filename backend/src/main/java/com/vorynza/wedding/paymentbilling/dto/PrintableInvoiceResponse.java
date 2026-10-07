package com.vorynza.wedding.paymentbilling.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PrintableInvoiceResponse(
        Long invoiceId,
        String invoiceNumber,
        Long reservationId,
        String customerName,
        String customerEmail,
        String customerPhone,
        String hallName,
        String packageName,
        LocalDate eventDate,
        Integer guestCount,
        BigDecimal amount,
        BigDecimal paidAmount,
        BigDecimal balance,
        String status,
        String paymentMethod,
        String createdAt,
        String printText
) {
}
