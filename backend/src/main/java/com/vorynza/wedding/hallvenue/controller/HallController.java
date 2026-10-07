package com.vorynza.wedding.hallvenue.controller;

import com.vorynza.wedding.common.ApiResponse;
import com.vorynza.wedding.hallvenue.dto.HallRequest;
import com.vorynza.wedding.hallvenue.dto.HallResponse;
import com.vorynza.wedding.hallvenue.service.HallService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/halls")
public class HallController {

    private final HallService hallService;

    public HallController(HallService hallService) {
        this.hallService = hallService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HallResponse>>> getAll(
            @RequestParam(required = false) Integer minCapacity
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Halls retrieved", hallService.findAll(minCapacity)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HallResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Hall retrieved", hallService.findById(id)));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Availability checked", hallService.checkAvailability(id, date)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HallResponse>> create(@Valid @RequestBody HallRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Hall created", hallService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HallResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody HallRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Hall updated", hallService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        hallService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Hall deactivated", null));
    }
}
