package com.vorynza.wedding.cateringmenu.controller;

import com.vorynza.wedding.cateringmenu.dto.CostEstimateRequest;
import com.vorynza.wedding.cateringmenu.dto.CostEstimateResponse;
import com.vorynza.wedding.cateringmenu.dto.MenuItemRequest;
import com.vorynza.wedding.cateringmenu.dto.MenuItemResponse;
import com.vorynza.wedding.cateringmenu.service.MenuItemService;
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
@RequestMapping("/api/menu-items")
public class MenuItemController {

    private final MenuItemService menuItemService;

    public MenuItemController(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getAll(
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Menu items retrieved", menuItemService.findAll(category)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Menu item retrieved", menuItemService.findById(id)));
    }

    @PostMapping("/estimate")
    public ResponseEntity<ApiResponse<CostEstimateResponse>> estimate(
            @Valid @RequestBody CostEstimateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Cost estimate calculated", menuItemService.estimateCost(request)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> create(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Menu item created", menuItemService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody MenuItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Menu item updated", menuItemService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        menuItemService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Menu item deactivated", null));
    }
}
