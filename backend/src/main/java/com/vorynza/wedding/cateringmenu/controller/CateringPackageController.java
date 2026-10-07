package com.vorynza.wedding.cateringmenu.controller;

import com.vorynza.wedding.cateringmenu.dto.CateringPackageRequest;
import com.vorynza.wedding.cateringmenu.dto.CateringPackageResponse;
import com.vorynza.wedding.cateringmenu.service.CateringPackageService;
import com.vorynza.wedding.common.ApiResponse;
import jakarta.validation.Valid;
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

import java.util.List;

@RestController
@RequestMapping("/api/catering-packages")
public class CateringPackageController {

    private final CateringPackageService cateringPackageService;

    public CateringPackageController(CateringPackageService cateringPackageService) {
        this.cateringPackageService = cateringPackageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CateringPackageResponse>>> getAll(
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Catering packages retrieved",
                cateringPackageService.findAll(category)
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CateringPackageResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Catering package retrieved", cateringPackageService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CateringPackageResponse>> create(
            @Valid @RequestBody CateringPackageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Catering package created", cateringPackageService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CateringPackageResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CateringPackageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Catering package updated", cateringPackageService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cateringPackageService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Catering package deactivated", null));
    }
}
