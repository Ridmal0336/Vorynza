package com.vorynza.wedding.paymentbilling.service;

import com.vorynza.wedding.common.BusinessException;
import com.vorynza.wedding.common.ResourceNotFoundException;
import com.vorynza.wedding.paymentbilling.dto.InvoiceRequest;
import com.vorynza.wedding.paymentbilling.dto.InvoiceResponse;
import com.vorynza.wedding.paymentbilling.dto.PaymentUpdateRequest;
import com.vorynza.wedding.paymentbilling.dto.PrintableInvoiceResponse;
import com.vorynza.wedding.paymentbilling.dto.ReportSummaryResponse;
import com.vorynza.wedding.paymentbilling.entity.Invoice;
import com.vorynza.wedding.paymentbilling.entity.InvoiceStatus;
import com.vorynza.wedding.paymentbilling.repository.InvoiceRepository;
import com.vorynza.wedding.reservation.entity.Reservation;
import com.vorynza.wedding.reservation.entity.ReservationStatus;
import com.vorynza.wedding.reservation.repository.ReservationRepository;
import com.vorynza.wedding.reservation.service.ReservationService;
import com.vorynza.wedding.useraccount.entity.User;
import com.vorynza.wedding.useraccount.entity.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ReservationService reservationService;
    private final ReservationRepository reservationRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            ReservationService reservationService,
            ReservationRepository reservationRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.reservationService = reservationService;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> findAll(User currentUser) {
        if (isStaff(currentUser)) {
            return invoiceRepository.findAll().stream().map(InvoiceResponse::from).toList();
        }
        return invoiceRepository.findByReservationUserId(currentUser.getId()).stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse findById(Long id, User currentUser) {
        Invoice invoice = getEntity(id);
        assertCanAccess(invoice, currentUser);
        return InvoiceResponse.from(invoice);
    }

    @Transactional(readOnly = true)
    public Invoice getEntity(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
    }

    @Transactional
    public InvoiceResponse create(InvoiceRequest request) {
        Reservation reservation = reservationService.getEntity(request.reservationId());
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Cannot invoice a cancelled reservation");
        }
        Invoice invoice = new Invoice();
        invoice.setReservation(reservation);
        invoice.setAmount(request.amount());
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setStatus(InvoiceStatus.UNPAID);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse updatePayment(Long id, PaymentUpdateRequest request) {
        Invoice invoice = getEntity(id);
        if (invoice.getStatus() == InvoiceStatus.VOID) {
            throw new BusinessException("Cannot update a voided invoice");
        }
        if (request.paidAmount().compareTo(invoice.getAmount()) > 0) {
            throw new BusinessException("Paid amount cannot exceed invoice amount");
        }

        invoice.setPaidAmount(request.paidAmount());
        invoice.setPaymentMethod(request.paymentMethod());

        int cmp = request.paidAmount().compareTo(invoice.getAmount());
        if (cmp == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(Instant.now());
        } else if (request.paidAmount().compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(InvoiceStatus.PARTIAL);
            invoice.setPaidAt(null);
        } else {
            invoice.setStatus(InvoiceStatus.UNPAID);
            invoice.setPaidAt(null);
        }
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse voidInvoice(Long id) {
        Invoice invoice = getEntity(id);
        invoice.setStatus(InvoiceStatus.VOID);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> historyByCustomer(Long customerId, User currentUser) {
        if (!isStaff(currentUser) && !currentUser.getId().equals(customerId)) {
            throw new BusinessException("You can only view your own invoice history");
        }
        return invoiceRepository.findHistory(customerId).stream().map(InvoiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ReportSummaryResponse summary() {
        BigDecimal billed = invoiceRepository.sumTotalAmount();
        BigDecimal collected = invoiceRepository.sumPaidAmount();
        return new ReportSummaryResponse(
                reservationRepository.count(),
                reservationRepository.countByStatus(ReservationStatus.PENDING),
                reservationRepository.countByStatus(ReservationStatus.CONFIRMED),
                reservationRepository.countByStatus(ReservationStatus.CANCELLED),
                invoiceRepository.count(),
                invoiceRepository.countByStatus(InvoiceStatus.UNPAID),
                invoiceRepository.countByStatus(InvoiceStatus.PAID),
                billed,
                collected,
                billed.subtract(collected)
        );
    }

    @Transactional(readOnly = true)
    public PrintableInvoiceResponse printable(Long id, User currentUser) {
        Invoice invoice = getEntity(id);
        assertCanAccess(invoice, currentUser);
        Reservation reservation = invoice.getReservation();
        String number = "INV-" + String.format("%06d", invoice.getId());
        BigDecimal balance = invoice.getAmount().subtract(invoice.getPaidAmount());
        String phone = reservation.getUser().getPhone() != null ? reservation.getUser().getPhone() : "-";
        String printText = """
                Vorynza Official Invoice %s
                Customer: %s <%s> | Phone: %s
                Reservation: #%s | Guests: %s
                Hall: %s | Package: %s
                Event Date: %s
                Amount: %s | Paid: %s | Balance: %s
                Status: %s | Method: %s
                """.formatted(
                number,
                reservation.getUser().getFullName(),
                reservation.getUser().getEmail(),
                phone,
                reservation.getId(),
                reservation.getGuestCount(),
                reservation.getHall().getName(),
                reservation.getWeddingPackage().getName(),
                reservation.getEventDate(),
                invoice.getAmount(),
                invoice.getPaidAmount(),
                balance,
                invoice.getStatus(),
                invoice.getPaymentMethod() != null ? invoice.getPaymentMethod() : "-"
        );
        return new PrintableInvoiceResponse(
                invoice.getId(),
                number,
                reservation.getId(),
                reservation.getUser().getFullName(),
                reservation.getUser().getEmail(),
                reservation.getUser().getPhone(),
                reservation.getHall().getName(),
                reservation.getWeddingPackage().getName(),
                reservation.getEventDate(),
                reservation.getGuestCount(),
                invoice.getAmount(),
                invoice.getPaidAmount(),
                balance,
                invoice.getStatus().name(),
                invoice.getPaymentMethod(),
                invoice.getCreatedAt().toString(),
                printText
        );
    }

    private void assertCanAccess(Invoice invoice, User currentUser) {
        if (isStaff(currentUser)) {
            return;
        }
        if (!invoice.getReservation().getUser().getId().equals(currentUser.getId())) {
            throw new BusinessException("You can only access your own invoices");
        }
    }

    private boolean isStaff(User user) {
        return user.getRole() == UserRole.ADMIN
                || user.getRole() == UserRole.MANAGER
                || user.getRole() == UserRole.STAFF;
    }
}
