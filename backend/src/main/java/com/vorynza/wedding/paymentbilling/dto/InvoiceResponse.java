package com.vorynza.wedding.paymentbilling.dto;

import com.vorynza.wedding.paymentbilling.entity.Invoice;
import com.vorynza.wedding.paymentbilling.entity.InvoiceStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record InvoiceResponse(
        Long id,
        Long reservationId,
        Long customerId,
        String customerName,
        BigDecimal amount,
        BigDecimal paidAmount,
        BigDecimal balance,
        InvoiceStatus status,
        String paymentMethod,
        Instant paidAt,
        Instant createdAt
) {
    public static InvoiceResponse from(Invoice invoice) {
        BigDecimal balance = invoice.getAmount().subtract(invoice.getPaidAmount());
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getReservation().getId(),
                invoice.getReservation().getUser().getId(),
                invoice.getReservation().getUser().getFullName(),
                invoice.getAmount(),
                invoice.getPaidAmount(),
                balance,
                invoice.getStatus(),
                invoice.getPaymentMethod(),
                invoice.getPaidAt(),
                invoice.getCreatedAt()
        );
    }
}
