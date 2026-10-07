package com.vorynza.wedding.weddingpackage.controller;

import com.vorynza.wedding.common.ApiResponse;
import com.vorynza.wedding.weddingpackage.dto.PackageRequest;
import com.vorynza.wedding.weddingpackage.dto.PackageResponse;
import com.vorynza.wedding.weddingpackage.service.WeddingPackageService;
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

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/packages")
public class WeddingPackageController {

    private final WeddingPackageService packageService;

    public WeddingPackageController(WeddingPackageService packageService) {
        this.packageService = packageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PackageResponse>>> search(
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean featured
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Packages retrieved",
                packageService.search(minPrice, maxPrice, type, featured)
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PackageResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Package retrieved", packageService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PackageResponse>> create(@Valid @RequestBody PackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Package created", packageService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PackageResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PackageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Package updated", packageService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        packageService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Package deactivated", null));
    }
}
