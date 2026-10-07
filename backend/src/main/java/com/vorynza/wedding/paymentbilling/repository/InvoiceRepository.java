package com.vorynza.wedding.paymentbilling.repository;

import com.vorynza.wedding.paymentbilling.entity.Invoice;
import com.vorynza.wedding.paymentbilling.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByReservationUserId(Long userId);

    long countByStatus(InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Invoice i WHERE i.status <> com.vorynza.wedding.paymentbilling.entity.InvoiceStatus.VOID")
    BigDecimal sumTotalAmount();

    @Query("SELECT COALESCE(SUM(i.paidAmount), 0) FROM Invoice i WHERE i.status <> com.vorynza.wedding.paymentbilling.entity.InvoiceStatus.VOID")
    BigDecimal sumPaidAmount();

    @Query("""
            SELECT i FROM Invoice i
            WHERE (:customerId IS NULL OR i.reservation.user.id = :customerId)
            ORDER BY i.createdAt DESC
            """)
    List<Invoice> findHistory(@Param("customerId") Long customerId);
}
