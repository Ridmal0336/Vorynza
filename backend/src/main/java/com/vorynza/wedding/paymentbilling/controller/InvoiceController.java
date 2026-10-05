package com.vorynza.wedding.paymentbilling.controller;

import com.vorynza.wedding.common.ApiResponse;
import com.vorynza.wedding.common.SecurityUtils;
import com.vorynza.wedding.paymentbilling.dto.InvoiceRequest;
import com.vorynza.wedding.paymentbilling.dto.InvoiceResponse;
import com.vorynza.wedding.paymentbilling.dto.PaymentUpdateRequest;
import com.vorynza.wedding.paymentbilling.dto.PrintableInvoiceResponse;
import com.vorynza.wedding.paymentbilling.service.InvoiceService;
import com.vorynza.wedding.useraccount.entity.User;
import com.vorynza.wedding.useraccount.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final UserService userService;

    public InvoiceController(InvoiceService invoiceService, UserService userService) {
        this.invoiceService = invoiceService;
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getAll(Authentication authentication) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok("Invoices retrieved", invoiceService.findAll(current)));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> history(
            @PathVariable Long customerId,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                "Invoice history retrieved",
                invoiceService.historyByCustomer(customerId, current)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok("Invoice retrieved", invoiceService.findById(id, current)));
    }

    @GetMapping("/{id}/print")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PrintableInvoiceResponse>> print(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok("Printable invoice", invoiceService.printable(id, current)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(@Valid @RequestBody InvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Invoice created", invoiceService.create(request)));
    }

    @PutMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updatePayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Payment updated", invoiceService.updatePayment(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> voidInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Invoice voided", invoiceService.voidInvoice(id)));
    }

    private User currentUser(Authentication authentication) {
        return userService.getByEmail(SecurityUtils.requireEmail(authentication));
    }
}
