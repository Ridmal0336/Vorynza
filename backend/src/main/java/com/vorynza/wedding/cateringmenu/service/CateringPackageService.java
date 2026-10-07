package com.vorynza.wedding.cateringmenu.service;

import com.vorynza.wedding.cateringmenu.dto.CateringPackageRequest;
import com.vorynza.wedding.cateringmenu.dto.CateringPackageResponse;
import com.vorynza.wedding.cateringmenu.entity.CateringPackage;
import com.vorynza.wedding.cateringmenu.repository.CateringPackageRepository;
import com.vorynza.wedding.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CateringPackageService {

    private final CateringPackageRepository cateringPackageRepository;

    public CateringPackageService(CateringPackageRepository cateringPackageRepository) {
        this.cateringPackageRepository = cateringPackageRepository;
    }

    @Transactional(readOnly = true)
    public List<CateringPackageResponse> findAll(String category) {
        return cateringPackageRepository.findByCategory(category, true).stream()
                .map(CateringPackageResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CateringPackageResponse findById(Long id) {
        return CateringPackageResponse.from(getEntity(id));
    }

    @Transactional(readOnly = true)
    public CateringPackage getEntity(Long id) {
        return cateringPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catering package not found with id: " + id));
    }

    @Transactional
    public CateringPackageResponse create(CateringPackageRequest request) {
        CateringPackage entity = new CateringPackage();
        apply(entity, request);
        return CateringPackageResponse.from(cateringPackageRepository.save(entity));
    }

    @Transactional
    public CateringPackageResponse update(Long id, CateringPackageRequest request) {
        CateringPackage entity = getEntity(id);
        apply(entity, request);
        return CateringPackageResponse.from(cateringPackageRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        CateringPackage entity = getEntity(id);
        entity.setActive(false);
        cateringPackageRepository.save(entity);
    }

    private void apply(CateringPackage entity, CateringPackageRequest request) {
        entity.setName(request.name());
        entity.setCategory(request.category());
        entity.setPrice(request.price());
        entity.setDescription(request.description());
        entity.setVegetarian(request.vegetarian() != null && request.vegetarian());
        entity.setActive(request.active() == null || request.active());
    }
}
