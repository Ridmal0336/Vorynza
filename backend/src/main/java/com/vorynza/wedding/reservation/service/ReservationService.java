package com.vorynza.wedding.reservation.service;

import com.vorynza.wedding.common.BusinessException;
import com.vorynza.wedding.common.ResourceNotFoundException;
import com.vorynza.wedding.hallvenue.entity.Hall;
import com.vorynza.wedding.hallvenue.service.HallService;
import com.vorynza.wedding.reservation.dto.ReservationConfirmationResponse;
import com.vorynza.wedding.reservation.dto.ReservationRequest;
import com.vorynza.wedding.reservation.dto.ReservationResponse;
import com.vorynza.wedding.reservation.entity.Reservation;
import com.vorynza.wedding.reservation.entity.ReservationStatus;
import com.vorynza.wedding.reservation.repository.ReservationRepository;
import com.vorynza.wedding.useraccount.entity.User;
import com.vorynza.wedding.useraccount.entity.UserRole;
import com.vorynza.wedding.useraccount.service.UserService;
import com.vorynza.wedding.weddingpackage.entity.WeddingPackage;
import com.vorynza.wedding.weddingpackage.service.WeddingPackageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserService userService;
    private final HallService hallService;
    private final WeddingPackageService packageService;

    public ReservationService(
            ReservationRepository reservationRepository,
            UserService userService,
            HallService hallService,
            WeddingPackageService packageService
    ) {
        this.reservationRepository = reservationRepository;
        this.userService = userService;
        this.hallService = hallService;
        this.packageService = packageService;
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> findAll(User currentUser) {
        if (currentUser.getRole() == UserRole.ADMIN
                || currentUser.getRole() == UserRole.MANAGER
                || currentUser.getRole() == UserRole.STAFF) {
            return reservationRepository.findAllWithDetails().stream().map(ReservationResponse::from).toList();
        }
        return reservationRepository.findByUserIdWithDetails(currentUser.getId()).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReservationResponse findById(Long id, User currentUser) {
        Reservation reservation = getEntity(id);
        assertCanAccess(reservation, currentUser);
        return ReservationResponse.from(reservation);
    }

    @Transactional(readOnly = true)
    public Reservation getEntity(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    @Transactional
    public ReservationResponse create(ReservationRequest request, User currentUser) {
        Long userId = request.userId();
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            userId = currentUser.getId();
        } else if (userId == null) {
            userId = currentUser.getId();
        }

        User user = userService.getEntity(userId);
        Hall hall = hallService.getEntity(request.hallId());
        WeddingPackage weddingPackage = packageService.getEntity(request.packageId());

        if (!hall.isActive()) {
            throw new BusinessException("Hall is not available for booking");
        }
        if (!weddingPackage.isActive()) {
            throw new BusinessException("Package is not available for booking");
        }
        if (request.guestCount() > hall.getCapacity()) {
            throw new BusinessException("Guest count exceeds hall capacity of " + hall.getCapacity());
        }
        if (reservationRepository.existsActiveBooking(hall.getId(), request.eventDate())) {
            throw new BusinessException("Hall is already booked for the selected date");
        }

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setHall(hall);
        reservation.setWeddingPackage(weddingPackage);
        reservation.setEventDate(request.eventDate());
        reservation.setGuestCount(request.guestCount());
        reservation.setNotes(request.notes());
        reservation.setStatus(ReservationStatus.PENDING);
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse update(Long id, ReservationRequest request, User currentUser) {
        Reservation reservation = getEntity(id);
        assertCanAccess(reservation, currentUser);

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Cannot update a cancelled reservation");
        }

        Hall hall = hallService.getEntity(request.hallId());
        WeddingPackage weddingPackage = packageService.getEntity(request.packageId());

        if (!hall.isActive()) {
            throw new BusinessException("Hall is not available for booking");
        }
        if (!weddingPackage.isActive()) {
            throw new BusinessException("Package is not available for booking");
        }
        if (request.guestCount() > hall.getCapacity()) {
            throw new BusinessException("Guest count exceeds hall capacity of " + hall.getCapacity());
        }
        if (reservationRepository.existsActiveBookingExcluding(hall.getId(), request.eventDate(), id)) {
            throw new BusinessException("Hall is already booked for the selected date");
        }

        if (currentUser.getRole() == UserRole.ADMIN || currentUser.getRole() == UserRole.MANAGER) {
            if (request.userId() != null) {
                reservation.setUser(userService.getEntity(request.userId()));
            }
        }

        reservation.setHall(hall);
        reservation.setWeddingPackage(weddingPackage);
        reservation.setEventDate(request.eventDate());
        reservation.setGuestCount(request.guestCount());
        reservation.setNotes(request.notes());
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse updateStatus(Long id, ReservationStatus status, User currentUser) {
        if (currentUser.getRole() != UserRole.ADMIN
                && currentUser.getRole() != UserRole.MANAGER
                && currentUser.getRole() != UserRole.STAFF) {
            throw new BusinessException("Only staff can update reservation status");
        }
        Reservation reservation = getEntity(id);
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Cannot change status of a cancelled reservation");
        }
        if (status == null) {
            throw new BusinessException("Status is required");
        }
        if (status == ReservationStatus.CANCELLED) {
            throw new BusinessException("Use cancel endpoint to cancel a reservation");
        }
        reservation.setStatus(status);
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse cancel(Long id, User currentUser) {
        Reservation reservation = getEntity(id);
        assertCanAccess(reservation, currentUser);
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Reservation is already cancelled");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional(readOnly = true)
    public ReservationConfirmationResponse confirmation(Long id, User currentUser) {
        Reservation reservation = getEntity(id);
        assertCanAccess(reservation, currentUser);
        String code = "VRY-" + String.format("%06d", reservation.getId());
        return new ReservationConfirmationResponse(
                reservation.getId(),
                code,
                reservation.getUser().getFullName(),
                reservation.getHall().getName(),
                reservation.getWeddingPackage().getName(),
                reservation.getEventDate(),
                reservation.getGuestCount(),
                reservation.getStatus(),
                "Reservation confirmation for " + code
        );
    }

    private void assertCanAccess(Reservation reservation, User currentUser) {
        if (currentUser.getRole() == UserRole.ADMIN
                || currentUser.getRole() == UserRole.MANAGER
                || currentUser.getRole() == UserRole.STAFF) {
            return;
        }
        if (!reservation.getUser().getId().equals(currentUser.getId())) {
            throw new BusinessException("You can only access your own reservations");
        }
    }
}
