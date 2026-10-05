package com.vorynza.wedding.paymentbilling.controller;

import com.vorynza.wedding.common.ApiResponse;
import com.vorynza.wedding.paymentbilling.dto.ReportSummaryResponse;
import com.vorynza.wedding.paymentbilling.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final InvoiceService invoiceService;

    public ReportController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ReportSummaryResponse>> summary() {
        return ResponseEntity.ok(ApiResponse.ok("Report summary", invoiceService.summary()));
    }
}
