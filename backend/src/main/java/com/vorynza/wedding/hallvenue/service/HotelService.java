package com.vorynza.wedding.hallvenue.service;

import com.vorynza.wedding.common.BusinessException;
import com.vorynza.wedding.common.ResourceNotFoundException;
import com.vorynza.wedding.hallvenue.dto.HotelRequest;
import com.vorynza.wedding.hallvenue.dto.HotelResponse;
import com.vorynza.wedding.hallvenue.entity.Hotel;
import com.vorynza.wedding.hallvenue.repository.HallRepository;
import com.vorynza.wedding.hallvenue.repository.HotelRepository;
import com.vorynza.wedding.weddingpackage.repository.WeddingPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HotelService {

    private final HotelRepository hotelRepository;
    private final HallRepository hallRepository;
    private final WeddingPackageRepository packageRepository;

    public HotelService(
            HotelRepository hotelRepository,
            HallRepository hallRepository,
            WeddingPackageRepository packageRepository
    ) {
        this.hotelRepository = hotelRepository;
        this.hallRepository = hallRepository;
        this.packageRepository = packageRepository;
    }

    @Transactional(readOnly = true)
    public List<HotelResponse> findAll() {
        return hotelRepository.findAll().stream().map(HotelResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public HotelResponse findById(Long id) {
        return HotelResponse.from(getEntity(id));
    }

    @Transactional(readOnly = true)
    public Hotel getEntity(Long id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + id));
    }

    @Transactional
    public HotelResponse create(HotelRequest request) {
        Hotel hotel = new Hotel();
        apply(hotel, request);
        return HotelResponse.from(hotelRepository.save(hotel));
    }

    @Transactional
    public HotelResponse update(Long id, HotelRequest request) {
        Hotel hotel = getEntity(id);
        apply(hotel, request);
        return HotelResponse.from(hotelRepository.save(hotel));
    }

    @Transactional
    public void delete(Long id) {
        Hotel hotel = getEntity(id);
        if (hallRepository.countByHotelId(id) > 0 || packageRepository.countByHotelId(id) > 0) {
            throw new BusinessException("Cannot delete hotel with linked halls or packages. Remove those first.");
        }
        hotelRepository.delete(hotel);
    }

    private void apply(Hotel hotel, HotelRequest request) {
        hotel.setName(request.name());
        hotel.setLocation(request.location());
        hotel.setDescription(request.description());
        hotel.setContact(request.contact());
    }
}
