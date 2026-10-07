package com.vorynza.wedding.hallvenue.service;

import com.vorynza.wedding.common.ResourceNotFoundException;
import com.vorynza.wedding.hallvenue.dto.HallRequest;
import com.vorynza.wedding.hallvenue.dto.HallResponse;
import com.vorynza.wedding.hallvenue.entity.Hall;
import com.vorynza.wedding.hallvenue.entity.Hotel;
import com.vorynza.wedding.hallvenue.repository.HallRepository;
import com.vorynza.wedding.reservation.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class HallService {

    private final HallRepository hallRepository;
    private final HotelService hotelService;
    private final ReservationRepository reservationRepository;

    public HallService(
            HallRepository hallRepository,
            HotelService hotelService,
            ReservationRepository reservationRepository
    ) {
        this.hallRepository = hallRepository;
        this.hotelService = hotelService;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public List<HallResponse> findAll(Integer minCapacity) {
        return hallRepository.findByMinCapacity(minCapacity, true).stream()
                .map(HallResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public HallResponse findById(Long id) {
        return HallResponse.from(getEntity(id));
    }

    @Transactional(readOnly = true)
    public Hall getEntity(Long id) {
        return hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> checkAvailability(Long hallId, LocalDate date) {
        Hall hall = getEntity(hallId);
        boolean available = !reservationRepository.existsActiveBooking(hallId, date);
        return Map.of(
                "hallId", hall.getId(),
                "hallName", hall.getName(),
                "date", date.toString(),
                "available", available
        );
    }

    @Transactional
    public HallResponse create(HallRequest request) {
        Hall hall = new Hall();
        apply(hall, request);
        return HallResponse.from(hallRepository.save(hall));
    }

    @Transactional
    public HallResponse update(Long id, HallRequest request) {
        Hall hall = getEntity(id);
        apply(hall, request);
        return HallResponse.from(hallRepository.save(hall));
    }

    @Transactional
    public void delete(Long id) {
        Hall hall = getEntity(id);
        hall.setActive(false);
        hallRepository.save(hall);
    }

    private void apply(Hall hall, HallRequest request) {
        Hotel hotel = hotelService.getEntity(request.hotelId());
        hall.setHotel(hotel);
        hall.setName(request.name());
        hall.setCapacity(request.capacity());
        hall.setDecorationTheme(request.decorationTheme());
        hall.setPrice(request.price());
        hall.setImageUrls(request.imageUrls());
        hall.setAverageRating(request.averageRating());
        hall.setActive(request.active() == null || request.active());
    }
}
