package com.vorynza.wedding.reservation.controller;

import com.vorynza.wedding.common.ApiResponse;
import com.vorynza.wedding.common.SecurityUtils;
import com.vorynza.wedding.reservation.dto.ReservationConfirmationResponse;
import com.vorynza.wedding.reservation.dto.ReservationRequest;
import com.vorynza.wedding.reservation.dto.ReservationResponse;
import com.vorynza.wedding.reservation.dto.ReservationStatusRequest;
import com.vorynza.wedding.reservation.service.ReservationService;
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
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;
    private final UserService userService;

    public ReservationController(ReservationService reservationService, UserService userService) {
        this.reservationService = reservationService;
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getAll(Authentication authentication) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok("Reservations retrieved", reservationService.findAll(current)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReservationResponse>> getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok("Reservation retrieved", reservationService.findById(id, current)));
    }

    @GetMapping("/{id}/confirmation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReservationConfirmationResponse>> confirmation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                "Confirmation retrieved",
                reservationService.confirmation(id, current)
        ));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReservationResponse>> create(
            @Valid @RequestBody ReservationRequest request,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Reservation created", reservationService.create(request, current)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReservationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ReservationRequest request,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok("Reservation updated", reservationService.update(id, request, current)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ApiResponse<ReservationResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReservationStatusRequest request,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                "Reservation status updated",
                reservationService.updateStatus(id, request.status(), current)
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancel(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User current = currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok("Reservation cancelled", reservationService.cancel(id, current)));
    }

    private User currentUser(Authentication authentication) {
        return userService.getByEmail(SecurityUtils.requireEmail(authentication));
    }
}
