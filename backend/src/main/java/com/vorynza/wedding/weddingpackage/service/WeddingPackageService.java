package com.vorynza.wedding.weddingpackage.service;

import com.vorynza.wedding.common.ResourceNotFoundException;
import com.vorynza.wedding.hallvenue.entity.Hotel;
import com.vorynza.wedding.hallvenue.service.HotelService;
import com.vorynza.wedding.weddingpackage.dto.PackageRequest;
import com.vorynza.wedding.weddingpackage.dto.PackageResponse;
import com.vorynza.wedding.weddingpackage.entity.WeddingPackage;
import com.vorynza.wedding.weddingpackage.repository.WeddingPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WeddingPackageService {

    private final WeddingPackageRepository packageRepository;
    private final HotelService hotelService;

    public WeddingPackageService(WeddingPackageRepository packageRepository, HotelService hotelService) {
        this.packageRepository = packageRepository;
        this.hotelService = hotelService;
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> search(BigDecimal minPrice, BigDecimal maxPrice, String type, Boolean featured) {
        return packageRepository.search(minPrice, maxPrice, type, featured, true).stream()
                .map(PackageResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PackageResponse findById(Long id) {
        return PackageResponse.from(getEntity(id));
    }

    @Transactional(readOnly = true)
    public WeddingPackage getEntity(Long id) {
        return packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found with id: " + id));
    }

    @Transactional
    public PackageResponse create(PackageRequest request) {
        WeddingPackage entity = new WeddingPackage();
        apply(entity, request);
        return PackageResponse.from(packageRepository.save(entity));
    }

    @Transactional
    public PackageResponse update(Long id, PackageRequest request) {
        WeddingPackage entity = getEntity(id);
        apply(entity, request);
        return PackageResponse.from(packageRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        WeddingPackage entity = getEntity(id);
        entity.setActive(false);
        packageRepository.save(entity);
    }

    private void apply(WeddingPackage entity, PackageRequest request) {
        Hotel hotel = hotelService.getEntity(request.hotelId());
        entity.setHotel(hotel);
        entity.setName(request.name());
        entity.setPrice(request.price());
        entity.setInclusions(request.inclusions());
        entity.setDescription(request.description());
        entity.setPackageType(request.packageType());
        entity.setImageUrl(request.imageUrl());
        entity.setDiscountPercent(request.discountPercent() != null ? request.discountPercent() : BigDecimal.ZERO);
        entity.setFeatured(request.featured() != null && request.featured());
        entity.setActive(request.active() == null || request.active());
    }
}
