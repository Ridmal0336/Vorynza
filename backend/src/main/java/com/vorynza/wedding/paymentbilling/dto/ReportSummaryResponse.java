package com.vorynza.wedding.paymentbilling.dto;

import java.math.BigDecimal;

public record ReportSummaryResponse(
        long totalReservations,
        long pendingReservations,
        long confirmedReservations,
        long cancelledReservations,
        long totalInvoices,
        long unpaidInvoices,
        long paidInvoices,
        BigDecimal totalBilled,
        BigDecimal totalCollected,
        BigDecimal outstanding
) {
}
